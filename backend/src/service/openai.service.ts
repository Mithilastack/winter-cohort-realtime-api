import { OpenAI } from "openai";
import { Config } from "../config/config";

export const openai = new OpenAI({
  apiKey: Config.openaiApiKey,
});
