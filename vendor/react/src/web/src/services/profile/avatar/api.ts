import cryptoRandomString from 'crypto-random-string';


export const saveAvatar = async (blob: Blob): Promise<{ isSuccess: boolean; }> => {
  const formData = new FormData();

  let hex = cryptoRandomString({length: 10});
  formData.append('file', blob, `photo-preview-${hex}.jpeg`);

  const response = await fetch(`${import.meta.env.REACT_APP_AVATAR_UPLOADER_URL}/profile/avatar`, {
    method: "POST",
    body: formData,
  });

  return { isSuccess: response.ok }
};

export const deleteAvatar = async (): Promise<{ isSuccess: boolean; }> => {
  const response = await fetch(`${import.meta.env.REACT_APP_AVATAR_UPLOADER_URL}/profile/avatar`, {
      method: "DELETE",
  });

  return { isSuccess: response.ok }
};
