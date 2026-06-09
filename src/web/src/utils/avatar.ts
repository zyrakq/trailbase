

export const getPhoto = (photo?: string) => {
    let url = photo && (photo.indexOf('data:image') === -1 && photo.indexOf('http') === -1) ? `${import.meta.env.REACT_APP_AVATAR_DOWNLOADER_URL}/${photo}`: photo;
    return url;
  };

export const getMonogram = (username?: string) => {
    return username ? `${username?.charAt(0).toUpperCase()}` : '';
};
