export class Document {
    constructor(readonly id: string, readonly name: string, readonly content: string) {
    }
}

export class Sentence {
    constructor(readonly inputSentence: string, readonly translation: string,
                readonly attention: number[][], readonly beam: any) {
    }
}
