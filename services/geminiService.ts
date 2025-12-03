import { GoogleGenAI, Modality, Content } from "@google/genai";
import { PERSONA_INSTRUCTION } from '../constants';
import { Attachment, ChatMessage } from '../types';

let ai: GoogleGenAI | null = null;

const initializeAI = () => {
  if (!ai && process.env.API_KEY) {
    ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  }
  return ai;
};

// Helper: Convert ChatMessage[] to Gemini Content[]
const formatHistory = (messages: ChatMessage[]): Content[] => {
  return messages.map(m => {
    const parts: any[] = [{ text: m.text }];
    if (m.attachments) {
      m.attachments.forEach(att => {
        parts.push({
          inlineData: {
            mimeType: att.mimeType,
            data: att.data
          }
        });
      });
    }
    return {
      role: m.role,
      parts: parts
    };
  });
};

interface ChatOptions {
  useThinking?: boolean;
  useSearch?: boolean;
}

export const streamChatResponse = async (
  history: ChatMessage[],
  newMessage: string,
  attachments: Attachment[],
  options: ChatOptions,
  onChunk: (text: string) => void
): Promise<string> => {
  const client = initializeAI();
  if (!client) throw new Error("API Key not found.");

  // Determine Model
  // Thinking -> gemini-3-pro-preview
  // Search -> gemini-2.5-flash (fast & capable) or pro. Using Flash for speed unless Thinking is on.
  // Standard -> gemini-2.5-flash
  let modelName = 'gemini-2.5-flash';
  if (options.useThinking) {
    modelName = 'gemini-3-pro-preview';
  }

  // Construct Config
  const config: any = {
    systemInstruction: PERSONA_INSTRUCTION,
    temperature: options.useThinking ? 0.7 : 0.3, // Higher temp for creative thinking
  };

  if (options.useThinking) {
    config.thinkingConfig = { thinkingBudget: 32768 }; // Max budget
    // Note: Do not set maxOutputTokens when thinkingBudget is set unless carefully calculated.
  }

  if (options.useSearch) {
    config.tools = [{ googleSearch: {} }];
  }

  // Build Contents (History + New Message)
  const pastContent = formatHistory(history);
  
  const newParts: any[] = [{ text: newMessage }];
  if (attachments && attachments.length > 0) {
    attachments.forEach(att => {
      newParts.push({
        inlineData: {
          mimeType: att.mimeType,
          data: att.data
        }
      });
    });
  }

  // For generateContentStream with history, we pass all contents
  const contents = [...pastContent, { role: 'user', parts: newParts }];

  try {
    const resultStream = await client.models.generateContentStream({
      model: modelName,
      contents: contents,
      config: config
    });

    let fullText = "";
    for await (const chunk of resultStream) {
      const chunkText = chunk.text || "";
      fullText += chunkText;
      onChunk(fullText);
    }
    return fullText;
  } catch (error) {
    console.error("Gemini Chat Error:", error);
    throw error;
  }
};

export const transcribeAudio = async (audioBase64: string, mimeType: string = 'audio/wav'): Promise<string> => {
  const client = initializeAI();
  if (!client) throw new Error("AI not init");

  const response = await client.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: {
      parts: [
        { inlineData: { mimeType: mimeType, data: audioBase64 } },
        { text: "Transcribe the spoken audio exactly. Return only the text." }
      ]
    }
  });

  return response.text || "";
};

export const generateSpeech = async (text: string): Promise<ArrayBuffer> => {
  const client = initializeAI();
  if (!client) throw new Error("AI not init");

  const response = await client.models.generateContent({
    model: 'gemini-2.5-flash-preview-tts',
    contents: { parts: [{ text: text }] },
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: { voiceName: 'Kore' }, // Scholar voice
        },
      },
    },
  });

  const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  if (!base64Audio) throw new Error("No audio generated");

  // Decode Base64 to ArrayBuffer
  const binaryString = atob(base64Audio);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
};

// Audio Decoding Helper for Browser (to be used in Component)
export const decodeAudioData = async (
  arrayBuffer: ArrayBuffer,
  audioContext: AudioContext
): Promise<AudioBuffer> => {
   const dataInt16 = new Int16Array(arrayBuffer);
   const sampleRate = 24000; // Standard for Gemini TTS
   const numChannels = 1;
   const frameCount = dataInt16.length / numChannels;
   
   const buffer = audioContext.createBuffer(numChannels, frameCount, sampleRate);
   
   for (let channel = 0; channel < numChannels; channel++) {
     const channelData = buffer.getChannelData(channel);
     for (let i = 0; i < frameCount; i++) {
       // Normalize 16-bit integer to float [-1.0, 1.0]
       channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
     }
   }
   
   return buffer;
}
