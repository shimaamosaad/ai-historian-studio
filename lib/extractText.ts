import fs from "fs";
import * as pdf from "pdf-parse";

export async function extractTextFromFile(filePath: string) {
  try {
    const fullPath = `${process.cwd()}/public${filePath}`;

    const dataBuffer = fs.readFileSync(fullPath);

    const data = await (pdf as any)(dataBuffer);

    return data.text || "";
  } catch (error) {
    console.error("Text extraction error:", error);
    return "";
  }
}