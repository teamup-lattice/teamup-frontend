export async function signUp({ name, email }) {
  await new Promise((resolve) => setTimeout(resolve, 1200));

  if (email.toLowerCase().includes("fail")) {
    throw new Error("Network error");
  }

  return { name, email };
}

export async function signIn({ email, password }) {
  await new Promise((resolve) => setTimeout(resolve, 1200));

  if (email.toLowerCase().includes("fail")) {
    throw new Error("Network error");
  }

  if (password === "wrongpassword") {
    const error = new Error("Invalid credentials");
    error.code = "INVALID_CREDENTIALS";
    throw error;
  }

  return {
    name: "Ada",
    email,
    profileComplete: !email.toLowerCase().includes("new"),
  };
}
