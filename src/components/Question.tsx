import { useEffect, useState } from "react";
import _ from "lodash";
import "./Question.scss";

interface QuestionProps {
    hidden: boolean;
}

interface QuestionData {
    question: string;
    options: string[];
    reference: string;
}

export function Question({ hidden }: QuestionProps) {
    const [questionData, setQuestionData] = useState<QuestionData[] | null>(
        null
    );

    const [question, setQuestion] = useState<string | null>(null);
    const [options, setOptions] = useState<[number, string][] | null>(null);
    const [reference, setReference] = useState<string | null>(null);
    const [answered, setAnswered] = useState<boolean>(false);
    const [selected, setSelected] = useState<number | null>(null);
    const [correct, setCorrect] = useState<boolean | null>(null);
    const [questionNumber, setQuestionNumber] = useState<number>(1);

    useEffect(() => {
        fetch("questions.csv")
            .then((response) => response.text())
            .then((data) =>
                setQuestionData(
                    data.split("\n").filter(v => v.length > 1).map((line: string) => {
                        const lineData = line.split(",");
                        return {
                            question: lineData[0],
                            options: lineData.slice(1, 5),
                            reference: lineData[5],
                        };
                    })
                )
            );
    }, []);

    useEffect(() => {
        if (questionData) {
            let index = Math.floor(Math.random() * questionData.length);
            let options = _.shuffle([...questionData[index].options.entries()]);

            setQuestion(questionData[index].question);
            setOptions(options);
            setReference(questionData[index].reference);
        }
    }, [questionData, questionNumber]);

    let onClick = (option: number) => () => {
        setAnswered(true);
        setSelected(option);
        let correct = options?.filter((v) => v[0] == 0);
        setCorrect(correct![0][0] == option);
        console.log(correct);
    };

    return (
        <div id="question" hidden={hidden}>
            <h1>{question}</h1>
            <h2>
                <em>Reference: {reference}</em>
            </h2>
            <div className="container">
                {options?.map(([index, option]) => (
                    <div
                        className={`box${index == 0 ? " correctAnswer" : ""}${
                            answered ? " answered" : ""
                        }${index == selected ? " selected" : ""}`}
                        key={index}
                        onClick={onClick(index)}
                    >
                        {option}
                    </div>
                ))}
            </div>

            <h2>
                {correct != null ? (correct ? "Correct!" : "Incorrect!") : ""}
                <button
                onClick={() => {
                    setQuestionNumber(questionNumber + 1);
                    setAnswered(false);
                    setCorrect(null);
                }}
            >Next</button>
            </h2>
        </div>
    );
}
