// @flow

import Formatter from "./Formatter";
import {shortIntlFuncNames, builderContextFactory} from "./utils";
import invariant from "invariant";
import {stringBuilderFactory} from "tag-messageformat";
import type {
    htmlElementOptions,
    dateElementOptions,
    dateOptions,
    htmlMessageOptions,
    messageElementOptions,
    messageDescriptorType,
    messageOptions,
    numberElementOptions,
    numberOptions,
    pluralFormatOptions,
    relativeElementOptions,
    relativeOptions,
    intlHtmlFormatOptionsType, intlFormatOptionsType
} from "./types";

function HtmlElementBuilderFactory() {
    return new HtmlElementBuilder();
}

export class HtmlElementBuilder {

    constructor() {
        this._str = '';
    }

    append(value: string): void {
        this._str += value;
    }

    appendOpeningTag(tagName: string): void {
        this.append(`<${tagName}>`);
    }

    appendClosingTag(tagName: string): void {
        this.append(`</${tagName}>`);
    }

    appendChildren(value: any): void {
        this.append(value);
     }

    build(): string {
        return this._str;
    }
}

const defaultOpts = {
    htmlElementBuilderFactory: HtmlElementBuilderFactory,
    htmlMessageBuilderFactory: stringBuilderFactory,
    defaultHtmlElement: 'span',
    htmlElements: {},
};

function resolveRenderer(tagName, defaultHtmlElement) {
    const htmlElement = tagName || defaultHtmlElement;
    if (typeof htmlElement === 'string') {
        return htmlElement;
    }

    invariant(typeof htmlElement === 'function', '[Intl Fmt] All optional `htmlElements` must be either a string or function.');
    return htmlElement;
}

export default class HtmlFormatter extends Formatter {

    static create(options?: Object = {}) {
        const opts = Object.assign({
            message: 'm',
            messageElement: 'me',
            htmlMessage: 'h',
            htmlMessageElement: 'he',
            date: 'd',
            dateElement: 'de',
            time: 't',
            timeElement: 'te',
            number: 'n',
            numberElement: 'ne',
            relative: 'r',
            relativeElement: 're',
            plural: 'p'
        }, options);

        class CustomFormatter extends HtmlFormatter {
            [opts.message](messageDescriptor: messageDescriptorType, values?: Object = {}, options?: messageOptions = {}): mixed {
                return this.message(messageDescriptor, values, options);
            }

            [opts.htmlMessage](messageDescriptor: messageDescriptorType, values?: Object = {}): mixed {
                return this.htmlMessage(messageDescriptor, values);
            }

            [opts.date](value: any, options?: dateOptions = {}): string {
                return this.date(value, options);
            }

            [opts.time](value: any, options?: dateOptions = {}): string {
                return this.time(value, options);
            }

            [opts.number](value: any, options?: numberOptions = {}): string {
                return this.number(value, options);
            }

            [opts.relative](value: any, options?: relativeOptions = {}): string {
                return this.relative(value, options);
            }

            [opts.plural](value: any, options?: pluralFormatOptions = {}): 'zero' | 'one' | 'two' | 'few' | 'many' | 'other' {
                return this.plural(value, options);
            }

            [opts.messageElement](messageDescriptor: messageDescriptorType, values?: Object = {}, options?: messageElementOptions = {}): mixed {
                return this.messageElement(messageDescriptor, values, options);
            }

            [opts.htmlMessageElement](messageDescriptor: messageDescriptorType, values?: Object = {}, options?: htmlMessageOptions = {}): mixed {
                return this.htmlMessageElement(messageDescriptor, values, options);
            }

            [opts.dateElement](value: any, options?: dateElementOptions = {}): string {
                return this.dateElement(value, options);
            }

            [opts.timeElement](value: any, options?: dateElementOptions = {}): string {
                return this.timeElement(value, options);
            }

            [opts.numberElement](value: any, options?: numberElementOptions = {}): string {
                return this.numberElement(value, options);
            }

            [opts.relativeElement](value: any, options?: relativeElementOptions = {}): string {
                return this.relativeElement(value, options);
            }
        }

        return CustomFormatter;
    }

    constructor(locale: string = 'en', options?: intlHtmlFormatOptionsType = {}) {
        super(locale, Object.assign({}, defaultOpts, options));

        // Assign the default html elements for each formatter
        this._htmlElements = shortIntlFuncNames.reduce((acc, fnName) => {
            if (fnName === 'plural') {
                return acc;
            }

            acc[fnName] = resolveRenderer(
                this.options.htmlElements[fnName],
                this.options.defaultHtmlElement);
            return acc;
        }, {});
    }

    _formatElement(fnName: string, value: mixed, options?: htmlElementOptions): mixed {
        const { tagName, ...opts } = options;
        return this.renderElement(
            tagName || this._htmlElements[fnName],
            value,
            { ...opts, formatterName: fnName });
    }

    newInstance(locale: string, options?: intlFormatOptionsType = {}): Formatter {
        return new HtmlFormatter(locale, options);
    }

    // eslint-disable-next-line no-unused-vars
    renderElement(element: mixed, value: mixed, opts?: Object): mixed {
        const { htmlElementBuilderFactory, ...htmlOpts } = opts;

        if (typeof element === 'string') {
            const htmlElementBuilder = (htmlElementBuilderFactory || this.options.htmlElementBuilderFactory)();
            htmlElementBuilder.appendOpeningTag(element, htmlOpts);
            htmlElementBuilder.appendChildren(value, htmlOpts);
            htmlElementBuilder.appendClosingTag(element, htmlOpts);
            return htmlElementBuilder.build();
        }

        return element(value, htmlOpts);
    }

    messageElement(
        messageDescriptor: messageDescriptorType,
        values?: Object = {},
        options?: messageElementOptions = {}
    ): mixed
    {
        const { messageBuilderFactory, messageBuilderContextFactory, ...elementOpts } = options;
        const ctxFactory = messageBuilderContextFactory || this.options.htmlMessagebuilderContextFactory;
        return this._formatElement(
            'message',
            this.message(
                messageDescriptor,
                values, {
                    messageBuilderFactory: messageBuilderFactory || this.options.htmlMessageBuilderFactory,
                    messageBuilderContext: typeof ctxFactory === 'function' ?
                        ctxFactory(messageDescriptor.id) :
                        builderContextFactory()
                }),
            elementOpts
        );
    }

    htmlMessageElement(
        messageDescriptor: messageDescriptorType,
        values?: Object = {},
        options?: htmlMessageOptions = {}): mixed
    {
        return this._formatElement('htmlMessage', this.htmlMessage(messageDescriptor, values), options);
    }

    dateElement(value: any, options?: dateElementOptions = {}): mixed {
        const { tagName, ...fmtOpts } = options;
        return this._formatElement('date', this.date(value, fmtOpts), { tagName });
    }

    timeElement(value: any, options?: dateElementOptions = {}): mixed {
        const { tagName, ...fmtOpts } = options;
        return this._formatElement('time', this.time(value, fmtOpts), { tagName });
    }

    numberElement(value: any, options?: numberElementOptions = {}): mixed {
        const { tagName, ...fmtOpts } = options;
        return this._formatElement('number', this.number(value, fmtOpts), { tagName });
    }

    relativeElement(value: any, options?: relativeElementOptions = {}): mixed {
        const { tagName, ...fmtOpts } = options;
        return this._formatElement('relative', this.relative(value, fmtOpts), { tagName });
    }
}