// api/index.ts
// Supabase-only authentication (no email verification required) and authorized data operations.

import { supabase, isSupabaseConfigured, supabaseUrl, supabaseAnonKey } from "../src/lib/supabase";
import {
  isValidEmail,
  isValidPhone,
  validatePasswordStrength,
} from "../src/utils/validation";
import type {
  CampusEvent,
  Registration,
  User,
  College,
  UserRole,
  Notification,
  Testimonial,
} from "../types";
import { COLLEGES, TESTIMONIALS } from "../data/mockData";

function isNetworkFailure(err: unknown): boolean {
  if (!err) return false;
  const e = err as { name?: string; message?: string; status?: number };
  const msg = (e.message || "").toLowerCase();
  if (e.name === "TypeError" && (msg.includes("fetch") || msg.includes("network"))) {
    return true;
  }
  if (
    msg.includes("failed to fetch") ||
    msg.includes("networkerror") ||
    msg.includes("network request failed") ||
    msg.includes("load failed") ||
    msg.includes("enotfound")
  ) {
    return true;
  }
  if (e.status === 502 || e.status === 503 || e.status === 504) {
    return true;
  }
  return false;
}

const NETWORK_UNREACHABLE_MSG =
  "Unable to reach the Supabase authentication server. Please verify VITE_SUPABASE_URL points to an active Supabase project and check your connection.";

function assertSupabaseConfigured() {
  if (!isSupabaseConfigured) {
    throw new Error(
      "Supabase is not configured. Please set VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY (or VITE_SUPABASE_ANON_KEY) in your .env file."
    );
  }
}

function mapProfileToUser(profile: Record<string, any>): User {
  return {
    id: profile.id,
    name: profile.name,
    email: profile.email,
    role: profile.role as UserRole,
    college: profile.college,
    department: profile.department ?? undefined,
    year: profile.year ?? undefined,
    avatarUrl: profile.avatar_url ?? undefined,
  };
}

function mapEventRow(event: Record<string, any>): CampusEvent {
  return {
    id: event.id,
    title: event.title,
    description: event.description,
    date: event.date,
    time: event.time,
    venue: event.venue,
    posterUrl: event.poster_url || "",
    createdBy: event.created_by,
    college: event.college,
    audience: event.audience as "inter" | "outer",
    status: event.status as CampusEvent["status"],
    category: Array.isArray(event.category) ? event.category : [],
    organizer: {
      name: event.organizer_name,
      logo: event.organizer_logo ?? undefined,
    },
    location:
      event.location_lat != null && event.location_lng != null
        ? {
            lat: event.location_lat,
            lng: event.location_lng,
            address: event.location_address ?? undefined,
          }
        : undefined,
    contactDetails: Array.isArray(event.contact_details)
      ? event.contact_details
      : [],
  };
}

// --- AUTH APIs ---

export const apiLogin = async (email: string, password: string): Promise<User> => {
  assertSupabaseConfigured();

  const cleanEmail = email.trim().toLowerCase();
  if (!cleanEmail || !isValidEmail(cleanEmail)) {
    throw new Error("Please enter a valid email address.");
  }
  if (!password) {
    throw new Error("Please enter your password.");
  }

  let data: any;
  let error: any;
  try {
    const res = await supabase.auth.signInWithPassword({
      email: cleanEmail,
      password,
    });
    data = res.data;
    error = res.error;
  } catch (err) {
    if (isNetworkFailure(err)) {
      throw new Error(NETWORK_UNREACHABLE_MSG);
    }
    throw new Error("Unable to sign in right now. Please try again.");
  }

  if (error) {
    if (isNetworkFailure(error)) {
      throw new Error(NETWORK_UNREACHABLE_MSG);
    }

    const msg = (error.message || "").toLowerCase();
    const code = (error.code || "").toLowerCase();

    if (
      code === "invalid_credentials" ||
      msg.includes("invalid login credentials")
    ) {
      try {
        const { data: exists, error: rpcError } = await supabase.rpc(
          "is_email_registered",
          { p_email: cleanEmail }
        );
        if (!rpcError && exists === false) {
          throw new Error("No account found. Please sign up first.");
        }
      } catch (rpcCatch: any) {
        if (rpcCatch?.message === "No account found. Please sign up first.") {
          throw rpcCatch;
        }
      }
      throw new Error("Incorrect email or password.");
    }

    if (code === "email_not_confirmed" || msg.includes("email not confirmed")) {
      let autoConfirmEnabled: boolean | null = null;
      try {
        const settingsRes = await fetch(`${supabaseUrl}/auth/v1/settings`, {
          headers: { apikey: supabaseAnonKey },
        });
        if (settingsRes.ok) {
          const settings = await settingsRes.json();
          if (typeof settings?.mailer_autoconfirm === "boolean") {
            autoConfirmEnabled = settings.mailer_autoconfirm;
          }
        }
      } catch {
        // Ignore diagnostic lookup failures
      }

      if (autoConfirmEnabled === true) {
        throw new Error(
          "This account's email is marked unconfirmed in Supabase Auth because it was registered before 'Confirm email' was disabled. Confirm this user in Supabase Dashboard → Authentication → Users (or run the confirmation SQL in supabase_schema.sql), or sign up with a new email."
        );
      }

      if (autoConfirmEnabled === false) {
        throw new Error(
          "Email confirmation is still enabled in Supabase Dashboard. Please disable 'Confirm email' under Authentication → Providers → Email."
        );
      }

      throw new Error(
        "Supabase Auth rejected login because this account's email is unconfirmed. Please confirm the user under Authentication → Users or ensure 'Confirm email' is disabled."
      );
    }

    if (error.status === 429 || code === "over_request_rate_limit") {
      throw new Error("Too many login attempts. Please try again shortly.");
    }

    throw new Error(error.message || "Incorrect email or password.");
  }

  if (!data?.user || !data?.session) {
    throw new Error("Incorrect email or password.");
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", data.user.id)
    .single();

  if (profileError || !profile) {
    await supabase.auth.signOut().catch(() => {});
    if (
      profileError?.code === "PGRST205" ||
      profileError?.message?.includes("Could not find the table")
    ) {
      throw new Error(
        "Database tables are not initialized on this Supabase project (missing 'public.profiles'). Please run supabase_schema.sql in your Supabase SQL Editor."
      );
    }
    throw new Error(
      profileError?.message
        ? `Account profile could not be loaded: ${profileError.message}`
        : "Account profile not found. Please contact support."
    );
  }

  return mapProfileToUser(profile);
};

export const apiSignup = async (
  userToSignup: Omit<User, "id">,
  password: string
): Promise<void> => {
  assertSupabaseConfigured();

  const cleanEmail = userToSignup.email.trim().toLowerCase();
  const cleanName = userToSignup.name.trim();

  if (!cleanName) {
    throw new Error("Full name is required.");
  }
  if (!cleanEmail || !isValidEmail(cleanEmail)) {
    throw new Error("Please enter a valid email address.");
  }
  if (!userToSignup.college) {
    throw new Error("Please select your college.");
  }
  if (!["student", "faculty", "hod"].includes(userToSignup.role)) {
    throw new Error("Please select a valid account role.");
  }

  const passwordCheck = validatePasswordStrength(password);
  if (!passwordCheck.valid) {
    throw new Error(passwordCheck.message || "Password is too weak.");
  }

  let data: any;
  let error: any;
  try {
    const res = await supabase.auth.signUp({
      email: cleanEmail,
      password,
      options: {
        data: {
          name: cleanName,
          role: userToSignup.role,
          college: userToSignup.college,
          department: userToSignup.department || null,
          year: userToSignup.year || null,
          avatar_url: userToSignup.avatarUrl || null,
        },
      },
    });
    data = res.data;
    error = res.error;
  } catch (err) {
    if (isNetworkFailure(err)) {
      throw new Error(NETWORK_UNREACHABLE_MSG);
    }
    throw new Error("Signup failed due to an unexpected error. Please try again.");
  }

  if (error) {
    if (isNetworkFailure(error)) {
      throw new Error(NETWORK_UNREACHABLE_MSG);
    }
    const msg = (error.message || "").toLowerCase();
    if (
      error.code === "user_already_exists" ||
      msg.includes("already registered") ||
      msg.includes("already exists")
    ) {
      throw new Error("An account with this email already exists. Please log in instead.");
    }
    if (msg.includes("signups not allowed") || error.code === "signup_disabled") {
      throw new Error("Email signups are currently disabled in Supabase Auth settings.");
    }
    if (msg.includes("database error saving new user")) {
      throw new Error(
        "Database error while creating your profile. Please ensure the latest supabase_schema.sql migration has been applied."
      );
    }
    throw new Error(error.message || "Failed to create account.");
  }

  if (
    data?.user &&
    Array.isArray(data.user.identities) &&
    data.user.identities.length === 0
  ) {
    throw new Error("An account with this email already exists. Please log in instead.");
  }

  if (!data?.user) {
    throw new Error("Account creation did not return a valid user record.");
  }

  // If Supabase returned an active session (email confirmation disabled),
  // verify profile was created by trigger and insert it if missing, then sign out
  // so the user must manually log in before entering their dashboard.
  if (data.session) {
    const { data: existingProfile, error: existingProfileError } = await supabase
      .from("profiles")
      .select("id")
      .eq("id", data.user.id)
      .maybeSingle();

    if (
      existingProfileError?.code === "PGRST205" ||
      existingProfileError?.message?.includes("Could not find the table")
    ) {
      await supabase.auth.signOut().catch(() => {});
      throw new Error(
        "Account created in Auth, but database tables are missing ('public.profiles'). Please run supabase_schema.sql in your Supabase SQL Editor."
      );
    }

    if (!existingProfile) {
      const { error: insertError } = await supabase.from("profiles").insert({
        id: data.user.id,
        name: cleanName,
        email: cleanEmail,
        role: userToSignup.role,
        college: userToSignup.college,
        department: userToSignup.department || null,
        year: userToSignup.year || null,
        avatar_url: userToSignup.avatarUrl || null,
      });

      if (insertError) {
        await supabase.auth.signOut().catch(() => {});
        throw new Error(`Account created, but profile setup failed: ${insertError.message}`);
      }
    }

    await supabase.auth.signOut().catch(() => {});
  }
};

export const apiSendPasswordReset = async (email: string): Promise<void> => {
  assertSupabaseConfigured();

  const cleanEmail = email.trim().toLowerCase();
  if (!cleanEmail || !isValidEmail(cleanEmail)) {
    throw new Error("Please enter a valid email address.");
  }

  try {
    const { error } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) {
      if (isNetworkFailure(error)) {
        throw new Error(NETWORK_UNREACHABLE_MSG);
      }
      if (error.status === 429) {
        throw new Error("Too many requests. Please wait before trying again.");
      }
      throw new Error(error.message || "Unable to send password reset email.");
    }
  } catch (err: any) {
    if (isNetworkFailure(err)) {
      throw new Error(NETWORK_UNREACHABLE_MSG);
    }
    throw err;
  }
};

export const apiUpdatePassword = async (
  currentPassword: string,
  newPassword: string
): Promise<void> => {
  assertSupabaseConfigured();

  if (!currentPassword) {
    throw new Error("Please enter your current password.");
  }

  const strength = validatePasswordStrength(newPassword);
  if (!strength.valid) {
    throw new Error(strength.message || "New password is not strong enough.");
  }

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user || !user.email) {
    throw new Error("Your session has expired. Please log in again.");
  }

  const { error: verifyError } = await supabase.auth.signInWithPassword({
    email: user.email,
    password: currentPassword,
  });

  if (verifyError) {
    if (isNetworkFailure(verifyError)) {
      throw new Error(NETWORK_UNREACHABLE_MSG);
    }
    throw new Error("Current password is incorrect.");
  }

  const { error: updateError } = await supabase.auth.updateUser({
    password: newPassword,
  });

  if (updateError) {
    if (isNetworkFailure(updateError)) {
      throw new Error(NETWORK_UNREACHABLE_MSG);
    }
    throw new Error(updateError.message || "Failed to update password.");
  }
};

export const apiCompletePasswordRecovery = async (
  newPassword: string
): Promise<void> => {
  assertSupabaseConfigured();

  const strength = validatePasswordStrength(newPassword);
  if (!strength.valid) {
    throw new Error(strength.message || "New password is not strong enough.");
  }

  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) {
    if (isNetworkFailure(error)) {
      throw new Error(NETWORK_UNREACHABLE_MSG);
    }
    throw new Error(error.message || "Failed to reset password.");
  }
};

export const apiLogout = async (): Promise<void> => {
  try {
    await supabase.auth.signOut();
  } catch {
    // Sign out clears local session even if request fails
  }
};

export const apiFetchUserProfile = async (
  userId: string
): Promise<User | null> => {
  if (!isSupabaseConfigured || !userId) {
    return null;
  }

  let { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();

  // If access token just expired, let Supabase refresh the session once and retry
  if (
    profileError &&
    (profileError.code === "PGRST301" ||
      profileError.message?.toLowerCase().includes("jwt") ||
      profileError.message?.toLowerCase().includes("expired"))
  ) {
    const { data: refreshData, error: refreshError } =
      await supabase.auth.refreshSession();
    if (refreshError || !refreshData.session) {
      return null;
    }
    const retryRes = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();
    profile = retryRes.data;
    profileError = retryRes.error;
  }

  if (profileError) {
    // Row genuinely missing
    if (profileError.code === "PGRST116") {
      return null;
    }
    if (isNetworkFailure(profileError)) {
      throw new Error(NETWORK_UNREACHABLE_MSG);
    }
    throw new Error(profileError.message || "Failed to load user profile.");
  }

  if (!profile) {
    return null;
  }

  return mapProfileToUser(profile);
};

export const apiFetchCurrentUser = async (): Promise<User | null> => {
  if (!isSupabaseConfigured) {
    return null;
  }

  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError || !session?.user) {
    return null;
  }

  return apiFetchUserProfile(session.user.id);
};

export const apiUpdateUser = async (
  userId: string,
  updatedData: Partial<User>
): Promise<User> => {
  assertSupabaseConfigured();

  // Never allow updating role, college, or email from the client
  const safePayload: Record<string, unknown> = {};
  if (updatedData.name !== undefined) {
    const trimmed = updatedData.name.trim();
    if (!trimmed) throw new Error("Name cannot be empty.");
    safePayload.name = trimmed;
  }
  if (updatedData.department !== undefined) {
    safePayload.department = updatedData.department;
  }
  if (updatedData.year !== undefined) {
    safePayload.year = updatedData.year;
  }
  if (updatedData.avatarUrl !== undefined) {
    safePayload.avatar_url = updatedData.avatarUrl;
  }

  const { data: profile, error } = await supabase
    .from("profiles")
    .update(safePayload)
    .eq("id", userId)
    .select()
    .single();

  if (error || !profile) {
    throw new Error(error?.message || "Failed to update profile.");
  }

  return mapProfileToUser(profile);
};

export const apiFetchUsers = async (): Promise<User[]> => {
  if (!isSupabaseConfigured) {
    return [];
  }

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.user) {
    return [];
  }

  const { data, error } = await supabase.from("profiles").select("*");
  if (error || !data) {
    return [];
  }

  return data.map(mapProfileToUser);
};

// --- EVENT APIs ---

const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const MAX_POSTER_SIZE_BYTES = 5 * 1024 * 1024;

export const apiUploadPoster = async (
  file: File,
  audience: "inter" | "outer"
): Promise<string> => {
  assertSupabaseConfigured();

  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    throw new Error("Invalid file type. Please upload a JPG, PNG, WebP, or GIF image.");
  }
  if (file.size > MAX_POSTER_SIZE_BYTES) {
    throw new Error("Poster image must be smaller than 5MB.");
  }

  const fileExt = file.name.split(".").pop()?.toLowerCase() || "png";
  const safeExt = ["jpg", "jpeg", "png", "webp", "gif"].includes(fileExt)
    ? fileExt
    : "png";
  const fileName = `${crypto.randomUUID()}.${safeExt}`;
  const filePath = `${audience}/${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from("event-posters")
    .upload(filePath, file, { contentType: file.type });

  if (uploadError) {
    throw new Error(uploadError.message || "Failed to upload event poster.");
  }

  const { data } = supabase.storage.from("event-posters").getPublicUrl(filePath);
  if (!data?.publicUrl) {
    throw new Error("Unable to retrieve uploaded poster URL.");
  }

  return data.publicUrl;
};

export const apiFetchEvents = async (): Promise<CampusEvent[]> => {
  if (!isSupabaseConfigured) {
    return [];
  }

  const { data, error } = await supabase
    .from("events")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    if (isNetworkFailure(error)) {
      throw new Error(NETWORK_UNREACHABLE_MSG);
    }
    throw new Error(error.message || "Failed to fetch events.");
  }

  return (data || []).map(mapEventRow);
};

export const apiAddEvent = async (
  eventData: Omit<CampusEvent, "id">
): Promise<CampusEvent> => {
  assertSupabaseConfigured();

  const { data, error } = await supabase
    .from("events")
    .insert({
      title: eventData.title.trim(),
      description: eventData.description,
      date: eventData.date,
      time: eventData.time,
      venue: eventData.venue.trim(),
      poster_url: eventData.posterUrl,
      created_by: eventData.createdBy,
      college: eventData.college,
      audience: eventData.audience,
      status: "pending",
      category: eventData.category,
      organizer_name: eventData.organizer.name,
      organizer_logo: eventData.organizer.logo,
      location_lat: eventData.location?.lat,
      location_lng: eventData.location?.lng,
      location_address: eventData.location?.address,
      contact_details: eventData.contactDetails || [],
    })
    .select()
    .single();

  if (error || !data) {
    throw new Error(error?.message || "Failed to submit event.");
  }

  return mapEventRow(data);
};

export const apiUpdateEvent = async (
  eventId: string,
  updatedData: Partial<CampusEvent>
): Promise<CampusEvent> => {
  assertSupabaseConfigured();

  const updatePayload: Record<string, unknown> = {};
  if (updatedData.title !== undefined) updatePayload.title = updatedData.title;
  if (updatedData.description !== undefined)
    updatePayload.description = updatedData.description;
  if (updatedData.date !== undefined) updatePayload.date = updatedData.date;
  if (updatedData.time !== undefined) updatePayload.time = updatedData.time;
  if (updatedData.venue !== undefined) updatePayload.venue = updatedData.venue;
  if (updatedData.posterUrl !== undefined)
    updatePayload.poster_url = updatedData.posterUrl;
  if (updatedData.status !== undefined) updatePayload.status = updatedData.status;
  if (updatedData.category !== undefined)
    updatePayload.category = updatedData.category;
  if (updatedData.organizer) {
    if (updatedData.organizer.name)
      updatePayload.organizer_name = updatedData.organizer.name;
    if (updatedData.organizer.logo)
      updatePayload.organizer_logo = updatedData.organizer.logo;
  }
  if (updatedData.location) {
    if (updatedData.location.lat !== undefined)
      updatePayload.location_lat = updatedData.location.lat;
    if (updatedData.location.lng !== undefined)
      updatePayload.location_lng = updatedData.location.lng;
    if (updatedData.location.address !== undefined)
      updatePayload.location_address = updatedData.location.address;
  }
  if (updatedData.contactDetails !== undefined)
    updatePayload.contact_details = updatedData.contactDetails;

  const { data, error } = await supabase
    .from("events")
    .update(updatePayload)
    .eq("id", eventId)
    .select()
    .single();

  if (error || !data) {
    throw new Error(error?.message || "Unauthorized or failed to update event.");
  }

  return mapEventRow(data);
};

export const apiRemoveEvent = async (eventId: string): Promise<string> => {
  assertSupabaseConfigured();

  const { error } = await supabase.from("events").delete().eq("id", eventId);
  if (error) {
    throw new Error(error.message || "Unauthorized or failed to delete event.");
  }
  return eventId;
};

// --- REGISTRATION APIs ---

export const apiFetchRegistrations = async (): Promise<Registration[]> => {
  if (!isSupabaseConfigured) {
    return [];
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return [];
  }

  const { data, error } = await supabase.from("registrations").select("*");
  if (error) {
    throw new Error(error.message || "Failed to load registrations.");
  }

  return (data || []).map((reg) => ({
    id: reg.id,
    eventId: reg.event_id,
    userId: reg.user_id ?? undefined,
    guestDetails: reg.guest_details ?? undefined,
    ticketStatus: reg.ticket_status as "Confirmed" | "Pending",
  }));
};

export const apiAddRegistration = async (
  registrationData: Omit<Registration, "id">
): Promise<Registration> => {
  assertSupabaseConfigured();

  if (registrationData.guestDetails) {
    const g = registrationData.guestDetails;
    if (
      !g.name?.trim() ||
      !g.college?.trim() ||
      !g.department?.trim() ||
      !g.email?.trim() ||
      !g.phone?.trim()
    ) {
      throw new Error("All registration fields are required.");
    }
    if (!isValidEmail(g.email)) {
      throw new Error("Please enter a valid email address.");
    }
    if (!isValidPhone(g.phone)) {
      throw new Error("Please enter a valid phone number.");
    }

    const { data, error } = await supabase.rpc("register_guest_for_event", {
      p_event_id: registrationData.eventId,
      p_name: g.name.trim(),
      p_college: g.college.trim(),
      p_department: g.department.trim(),
      p_email: g.email.trim().toLowerCase(),
      p_phone: g.phone.trim(),
    });

    if (error) {
      if (isNetworkFailure(error)) {
        throw new Error(NETWORK_UNREACHABLE_MSG);
      }
      if (
        error.code === "23505" ||
        error.message?.toLowerCase().includes("already registered")
      ) {
        throw new Error("You have already registered for this event with this email.");
      }
      throw new Error(error.message || "Failed to complete guest registration.");
    }

    return {
      id: data.id,
      eventId: data.eventId,
      guestDetails: data.guestDetails,
      ticketStatus: data.ticketStatus || "Confirmed",
    };
  }

  if (!registrationData.userId) {
    throw new Error("Authentication or guest details are required to register.");
  }

  const { data, error } = await supabase
    .from("registrations")
    .insert({
      event_id: registrationData.eventId,
      user_id: registrationData.userId,
      guest_details: null,
      ticket_status: "Confirmed",
    })
    .select()
    .single();

  if (error || !data) {
    if (error?.code === "23505") {
      throw new Error("You are already registered for this event.");
    }
    if (error?.code === "42501") {
      throw new Error("You are not authorized to register for this event.");
    }
    throw new Error(error?.message || "Failed to complete registration.");
  }

  return {
    id: data.id,
    eventId: data.event_id,
    userId: data.user_id ?? undefined,
    guestDetails: data.guest_details ?? undefined,
    ticketStatus: data.ticket_status as "Confirmed" | "Pending",
  };
};

export const apiUpdateRegistrationStatus = async (
  registrationId: string,
  status: Registration["ticketStatus"]
): Promise<Registration> => {
  assertSupabaseConfigured();

  const { data, error } = await supabase
    .from("registrations")
    .update({ ticket_status: status })
    .eq("id", registrationId)
    .select()
    .single();

  if (error || !data) {
    throw new Error(error?.message || "Failed to update registration status.");
  }

  return {
    id: data.id,
    eventId: data.event_id,
    userId: data.user_id ?? undefined,
    guestDetails: data.guest_details ?? undefined,
    ticketStatus: data.ticket_status as "Confirmed" | "Pending",
  };
};

export const apiRemoveRegistration = async (
  registrationId: string
): Promise<string> => {
  assertSupabaseConfigured();

  const { error } = await supabase
    .from("registrations")
    .delete()
    .eq("id", registrationId);

  if (error) {
    throw new Error(error.message || "Failed to cancel registration.");
  }

  return registrationId;
};

// --- NOTIFICATION APIs ---

export const apiFetchNotifications = async (): Promise<Notification[]> => {
  if (!isSupabaseConfigured) {
    return [];
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return [];
  }

  const { data, error } = await supabase
    .from("notifications")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message || "Failed to load notifications.");
  }

  return (data || []).map((notif) => ({
    id: notif.id,
    userId: notif.user_id,
    message: notif.message,
    time: new Date(notif.created_at).toLocaleString(),
    eventId: notif.event_id,
  }));
};

// --- STATIC DATA APIs ---

export const apiFetchTestimonials = async (): Promise<Testimonial[]> => {
  return TESTIMONIALS;
};

export const apiFetchColleges = async (): Promise<College[]> => {
  return COLLEGES;
};
