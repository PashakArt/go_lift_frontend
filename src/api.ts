export interface SignInResponse {
  user_id: string;
  token: string;
}

// TODO убрать в енвы
// const BASE_URL = "https://b063-185-22-65-230.ngrok-free.app";
const BASE_URL = import.meta.env.VITE_BASE_URL;

console.log(123, BASE_URL);

export async function signInOrSignUp(
  initDataRaw: string,
): Promise<SignInResponse> {
  const response = await fetch(`${BASE_URL}/api/v1/auth`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      init_data: initDataRaw,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Бэк ответил кодом ${response.status}: ${errorText}`);
  }

  return response.json();
}
