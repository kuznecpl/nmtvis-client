export class Document {
    constructor(readonly id: string, readonly name: string, readonly content: string) {
    }

    sentences() {
        return this.content.match( /[^\.!\?]+[\.!\?]+/g );
    }
}
