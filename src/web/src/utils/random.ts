import { loremIpsum } from "lorem-ipsum";
import { LoremUnit } from "lorem-ipsum/types/src/constants/units";

export const get_random_number = (from: number, to: number): number => {
  return from === 0 ? Math.floor(Math.random() * to) : (Math.floor(Math.random() * to - from) + from);
}

export const get_words = (): string => {
  const text = loremIpsum({
    count: 2,                      // Количество параграфов текста
    format: 'plain',               // Формат текста (plain - обычный текст, html - HTML)
    units: 'words',           // Единицы измерения (sentences, words, paragraphs)
  });
  return text;
}

export const get_formatted_text = (from: number, to: number): any[] => {
  const text = loremIpsum({
    count: get_random_number(from, to),// Количество параграфов текста
    format: 'plain',               // Формат текста (plain - обычный текст, html - HTML)
    units: 'paragraphs',           // Единицы измерения (sentences, words, paragraphs)
  });
  return [
    {
      type: "paragraph",
      align: 'justify',
      children: 
      [{ 
        text: (!!text ? text: 'Hello world!')
      }],
    },
  ];
}


export const get_text = (from: number, to: number, units: LoremUnit): string => {
    const text = loremIpsum({
        count: get_random_number(from, to),                      // Количество параграфов текста
        format: 'plain',               // Формат текста (plain - обычный текст, html - HTML)
        units,           // Единицы измерения (sentences, words, paragraphs)
    });
    return text;
}

export const generateRandomDate = (beginDate: Date | undefined = undefined) => {
    const endDate = new Date(); // Дата через год
    const startDate = beginDate ?? new Date(endDate.getFullYear() - 1, endDate.getMonth(), endDate.getDate());
    
  
    const randomTimestamp = Math.floor(Math.random() * (endDate.getTime() - startDate.getTime()) + startDate.getTime());
    const randomDate = new Date(randomTimestamp);
  
    return randomDate;
};

enum ResponseStatus {
    Accepted,
    LoadingError,
}

const generateRandomImage = async (width: number, height: number) => {
    const response = await fetch(`https://api.unsplash.com/photos/random?w=${width}&h=${height}`, {
      method: "GET",
      headers: {
        Authorization: 'Client-ID zcb9jeRMJ81B6mNQVZpYFNuQITGOljoBYSh5zCKT4PI',
      },
    });
  
    let result = {
      status: ResponseStatus.LoadingError,
      error: "error loading",
      data: ""
    }
    if (response.ok) {
      const data = await response.json();
      result = {
        status: ResponseStatus.Accepted,
        data: data.urls.regular,
        error: ""
      }
    }
    return result;
};

let isAsyncOperationRunning = false;

const mutex = async (): Promise<void> => {
  if (isAsyncOperationRunning) {
    // Если асинхронная операция уже выполняется, ожидаем её завершения
    return await new Promise(resolve => {
      const interval = setInterval(() => {
        if (!isAsyncOperationRunning) {
          clearInterval(interval);
          resolve();
        }
      }, 10);
    });
  }
};

const getRandomImage = async (storage: string, length: number, width: number, height: number): Promise<string> => {
  return new Promise(resolve => {
    setTimeout(async() => {
      let result = '';
      let list = [] as string[];
      const listStr = localStorage.getItem(storage);
      if (listStr) {
        list = JSON.parse(listStr);
      }
      await mutex();
      isAsyncOperationRunning = true;
      if(list.length < length){
        const i = get_random_number(0 , list.length - 1);
        result = list[i];
        try {
          const res = await generateRandomImage(width, height);
          if(res.status === ResponseStatus.Accepted){
            result = res.data;
            list.push(result);
            localStorage.setItem(storage, JSON.stringify(list));
          }
        }
        catch {}
      }
      else {
        const i = get_random_number(0, length - 1);
        result = list[i];
      }
      isAsyncOperationRunning = false;

      resolve(result);
    }, 100);
  });
};

export const getRandomAvatar = async (): Promise<string> => {
  return getRandomImage('avatars', 5, 100, 100);
};

export const getRandomProfileAvatar = async (): Promise<string> => {
  return getRandomImage('profile-avatars', 5, 262, 262);
};

export const getRandomSubTypeImage = async (): Promise<string> => {
  return getRandomImage('subtype-images', 5, 273, 166);
  
};

export const getRandomTeaser = async (): Promise<string> => {
  return getRandomImage('teasers', 5, 630, 685);
};



