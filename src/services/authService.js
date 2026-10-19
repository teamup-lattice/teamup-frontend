export async function signUp({ name, email }) {
  await new Promise((resolve) => setTimeout(resolve, 1200));

  if (email.toLowerCase().includes("fail")) {
    throw new Error("Network error");
  }

  return { name, email };
}
