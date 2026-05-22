import { createContext, useContext } from "react";

export type QuestionSetReporter = (blockId: string, score01: number) => void;

export const QuestionSetContext = createContext<QuestionSetReporter | null>(null);

export const useQuestionSetReporter = (): QuestionSetReporter | null => useContext(QuestionSetContext);
