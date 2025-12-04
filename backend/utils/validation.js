function validateRegisterInput(body) {
  const errors = [];

  const cleaned = {
    firstname: (body.firstname || "").trim(),
    lastname: (body.lastname || "").trim(),
    email: (body.email || "").trim().toLowerCase(),
    username: (body.username || "").trim(),
    password: body.password || "",
  };

  // First name: required, max 30
  if (!cleaned.firstname) {
    errors.push("First name is required.");
  } else if (cleaned.firstname.length > 30) {
    errors.push("First name must be 30 characters or less.");
  }

  // Last name: required, max 30
  if (!cleaned.lastname) {
    errors.push("Last name is required.");
  } else if (cleaned.lastname.length > 30) {
    errors.push("Last name must be 30 characters or less.");
  }

  // Email: required, max 100, valid format
  if (!cleaned.email) {
    errors.push("Email is required.");
  } else if (cleaned.email.length > 100) {
    errors.push("Email must be 100 characters or less.");
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleaned.email)) {
    errors.push("Email format is invalid.");
  }

  // Username: required, 3–30, allowed chars
  if (!cleaned.username) {
    errors.push("Username is required.");
  } else if (cleaned.username.length < 3 || cleaned.username.length > 30) {
    errors.push("Username must be between 3 and 30 characters.");
  } else if (!/^[A-Za-z0-9_]+$/.test(cleaned.username)) {
    errors.push("Username can only contain letters, numbers, and underscores.");
  }

  // Password: required, 8–60
  if (!cleaned.password) {
    errors.push("Password is required.");
  } else if (cleaned.password.length < 8) {
    errors.push("Password must be at least 8 characters.");
  } else if (cleaned.password.length > 60) {
    errors.push("Password must be 60 characters or less.");
  }

  return { cleaned, errors };
}

function validateLoginInput(body) {
  const errors = [];

  const cleaned = {
    identifier: (body.identifier || "").trim(),
    password: body.password || "",
  };

  if (!cleaned.identifier) {
    errors.push("Username or email is required.");
  }
  if (!cleaned.password) {
    errors.push("Password is required.");
  }

  return { cleaned, errors };
}

module.exports = {
  validateRegisterInput,
  validateLoginInput,
};