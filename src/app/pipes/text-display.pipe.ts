import {Pipe, PipeTransform} from '@angular/core';

@Pipe({
    name: 'textDisplay'
})
export class TextDisplayPipe implements PipeTransform {

    transform(text: string, removeEOS: boolean): any {
        let rest = removeEOS ? text.slice(1, -4) : text.slice(1);

        return text.slice(0, 1).toUpperCase() + rest;
    }

}
