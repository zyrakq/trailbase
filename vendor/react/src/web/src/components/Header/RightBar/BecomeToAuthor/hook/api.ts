import { ResponseStatus } from "./types";


export const become_author = async (): Promise<{ status: ResponseStatus }> => {
  const response = await fetch(`${import.meta.env.REACT_APP_AUTHOR_SWITCHER_URL}/profile/became_author`, {
      method: "GET",
  });

  let status = ResponseStatus.LoadingError;

  if (response.ok) {
      status = ResponseStatus.Accepted;
  }

  return { status };
};
