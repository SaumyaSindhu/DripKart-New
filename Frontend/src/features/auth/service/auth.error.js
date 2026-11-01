export function getAuthErrorMessage(error) {
  const data = error?.response?.data;

  // express-validator format: { errors: [ { msg } ] }
  if (data?.errors?.length) return data.errors[0].msg;

  // controller format: { message }
  if (data?.message) return data.message;

  // request was sent but no response came back (server down, proxy error)
  if (error?.request && !error?.response) {
    return "Can't reach the server. Please try again.";
  }

  return "Something went wrong. Please try again.";
}
