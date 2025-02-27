// src/services/api.js
import axios from 'axios';

const API_URL = '/api/yandex';

export const sendMessageToYandexGPT = async (apiKey, data) => {
  try {
    const response = await axios.post(API_URL, {
      modelUri: 'gpt://b1gb5lrqp1jr1tmamu2t/yandexgpt/rc',
      completionOptions: {
        stream: false,
        temperature: 0.6,
        maxTokens: 2000,
      },
      messages: data.messages
    }, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Api-Key ${apiKey}`,
      }
    });
    
    return response.data;
  } catch (error) {
    console.error('Error calling Yandex GPT API:', error);
    throw error;
  }
};

export const generateChatTitle = async (apiKey, userMessage, assistantResponse) => {
  try {
    const response = await axios.post(API_URL, {
      modelUri: 'gpt://b1gb5lrqp1jr1tmamu2t/yandexgpt',
      completionOptions: {
        stream: false,
        temperature: 0.7,
        maxTokens: 50,
      },
      messages: [
        {
          role: 'system',
          text: 'Ты должен создать короткое название для диалога из трех слов, основываясь на сообщении пользователя и ответе ассистента. Название должно отражать суть разговора. Используй существительные и прилагательные. Ответ - только три слова через пробел.'
        },
        {
          role: 'user',
          text: `Создай название диалога из трех слов, основываясь на этом разговоре:\nПользователь: ${userMessage}\nАссистент: ${assistantResponse}`
        }
      ]
    }, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Api-Key ${apiKey}`,
      }
    });
    
    if (response.data?.result?.alternatives?.[0]?.message?.text) {
      return response.data.result.alternatives[0].message.text.trim();
    }
    return 'Новый интересный диалог';
  } catch (error) {
    console.error('Error generating chat title:', error);
    return 'Новый интересный диалог';
  }
};