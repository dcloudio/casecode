/*---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 *--------------------------------------------------------*/

import { FontStyle } from "./theme";

export type EncodedTokenAttributes = number;

export namespace EncodedTokenAttributes {
	export function toBinaryStr(encodedTokenAttributes: EncodedTokenAttributes): string {
		return encodedTokenAttributes.toString(2).padStart(32, "0");
	}

	export function print(encodedTokenAttributes: EncodedTokenAttributes): void {
		const languageId = EncodedTokenAttributes.getLanguageId(encodedTokenAttributes);
		const tokenType = EncodedTokenAttributes.getTokenType(encodedTokenAttributes);
		const fontStyle = EncodedTokenAttributes.getFontStyle(encodedTokenAttributes);
		const foreground = EncodedTokenAttributes.getForeground(encodedTokenAttributes);
		const background = EncodedTokenAttributes.getBackground(encodedTokenAttributes);

		console.log({
			languageId: languageId,
			tokenType: tokenType,
			fontStyle: fontStyle,
			foreground: foreground,
			background: background,
		});
	}

	export function getLanguageId(encodedTokenAttributes: EncodedTokenAttributes): number {
		return (
			(encodedTokenAttributes & EncodedTokenDataConsts.LANGUAGEID_MASK) >>>
			EncodedTokenDataConsts.LANGUAGEID_OFFSET
		);
	}

	export function getTokenType(encodedTokenAttributes: EncodedTokenAttributes): StandardTokenType {
		return (
			(encodedTokenAttributes & EncodedTokenDataConsts.TOKEN_TYPE_MASK) >>>
			EncodedTokenDataConsts.TOKEN_TYPE_OFFSET
		);
	}

	export function containsBalancedBrackets(encodedTokenAttributes: EncodedTokenAttributes): boolean {
		return (encodedTokenAttributes & EncodedTokenDataConsts.BALANCED_BRACKETS_MASK) !== 0;
	}

	export function getFontStyle(encodedTokenAttributes: EncodedTokenAttributes): number {
		return (
			(encodedTokenAttributes & EncodedTokenDataConsts.FONT_STYLE_MASK) >>>
			EncodedTokenDataConsts.FONT_STYLE_OFFSET
		);
	}

	export function getForeground(encodedTokenAttributes: EncodedTokenAttributes): number {
		return (
			(encodedTokenAttributes & EncodedTokenDataConsts.FOREGROUND_MASK) >>>
			EncodedTokenDataConsts.FOREGROUND_OFFSET
		);
	}

	export function getBackground(encodedTokenAttributes: EncodedTokenAttributes): number {
		return (
			(encodedTokenAttributes & EncodedTokenDataConsts.BACKGROUND_MASK) >>>
			EncodedTokenDataConsts.BACKGROUND_OFFSET
		);
	}

	/**
	 * Updates the fields in `metadata`.
	 * A value of `0`, `NotSet` or `null` indicates that the corresponding field should be left as is.
	 */
	export function set(
		encodedTokenAttributes: EncodedTokenAttributes,
		languageId: number | 0,
		tokenType: OptionalStandardTokenType | OptionalStandardTokenType.NotSet,
		containsBalancedBrackets: boolean | null,
		fontStyle: FontStyle | FontStyle.NotSet,
		foreground: number | 0,
		background: number | 0
	): number {
		let _languageId = EncodedTokenAttributes.getLanguageId(encodedTokenAttributes);
		let _tokenType = EncodedTokenAttributes.getTokenType(encodedTokenAttributes);
		let _containsBalancedBracketsBit: 0 | 1 =
			EncodedTokenAttributes.containsBalancedBrackets(encodedTokenAttributes) ? 1 : 0;
		let _fontStyle = EncodedTokenAttributes.getFontStyle(encodedTokenAttributes);
		let _foreground = EncodedTokenAttributes.getForeground(encodedTokenAttributes);
		let _background = EncodedTokenAttributes.getBackground(encodedTokenAttributes);

		if (languageId !== 0) {
			_languageId = languageId;
		}
		if (tokenType !== OptionalStandardTokenType.NotSet) {
			_tokenType = fromOptionalTokenType(tokenType);
		}
		if (containsBalancedBrackets !== null) {
			_containsBalancedBracketsBit = containsBalancedBrackets ? 1 : 0;
		}
		if (fontStyle !== FontStyle.NotSet) {
			_fontStyle = fontStyle;
		}
		if (foreground !== 0) {
			_foreground = foreground;
		}
		if (background !== 0) {
			_background = background;
		}

		return (
			((_languageId << EncodedTokenDataConsts.LANGUAGEID_OFFSET) |
				(_tokenType << EncodedTokenDataConsts.TOKEN_TYPE_OFFSET) |
				(_containsBalancedBracketsBit <<
					EncodedTokenDataConsts.BALANCED_BRACKETS_OFFSET) |
				(_fontStyle << EncodedTokenDataConsts.FONT_STYLE_OFFSET) |
				(_foreground << EncodedTokenDataConsts.FOREGROUND_OFFSET) |
				(_background << EncodedTokenDataConsts.BACKGROUND_OFFSET)) >>>
			0
		);
	}
}

/**
 * Helpers to manage the "collapsed" metadata of an entire StackElement stack.
 * The following assumptions have been made:
 *  - languageId < 256 => needs 8 bits
 *  - unique color count < 512 => needs 9 bits
 *
 * The binary format is:
 * - -------------------------------------------
 *     3322 2222 2222 1111 1111 1100 0000 0000
 *     1098 7654 3210 9876 5432 1098 7654 3210
 * - -------------------------------------------
 *     xxxx xxxx xxxx xxxx xxxx xxxx xxxx xxxx
 *     bbbb bbbb ffff ffff fFFF FBTT LLLL LLLL
 * - -------------------------------------------
 *  - L = LanguageId (8 bits)
 *  - T = StandardTokenType (2 bits)
 *  - B = Balanced bracket (1 bit)
 *  - F = FontStyle (4 bits)
 *  - f = foreground color (9 bits)
 *  - b = background color (9 bits)
 */
const enum EncodedTokenDataConsts {
	LANGUAGEID_MASK = 0b00000000000000000000000011111111,
	TOKEN_TYPE_MASK = 0b00000000000000000000001100000000,
	BALANCED_BRACKETS_MASK = 0b00000000000000000000010000000000,
	FONT_STYLE_MASK = 0b00000000000000000111100000000000,
	FOREGROUND_MASK = 0b00000000111111111000000000000000,
	BACKGROUND_MASK = 0b11111111000000000000000000000000,

	LANGUAGEID_OFFSET = 0,
	TOKEN_TYPE_OFFSET = 8,
	BALANCED_BRACKETS_OFFSET = 10,
	FONT_STYLE_OFFSET = 11,
	FOREGROUND_OFFSET = 15,
	BACKGROUND_OFFSET = 24
}

export const enum StandardTokenType {
	Other = 0,
	Comment = 1,
	String = 2,
	RegEx = 3
}

export function toOptionalTokenType(standardType: StandardTokenType): OptionalStandardTokenType {
	return standardType as any as OptionalStandardTokenType;
}

function fromOptionalTokenType(
	standardType:
		| OptionalStandardTokenType.Other
		| OptionalStandardTokenType.Comment
		| OptionalStandardTokenType.String
		| OptionalStandardTokenType.RegEx
): StandardTokenType {
	return standardType as any as StandardTokenType;
}

// Must have the same values as `StandardTokenType`!
export const enum OptionalStandardTokenType {
	Other = 0,
	Comment = 1,
	String = 2,
	RegEx = 3,
	// Indicates that no token type is set.
	NotSet = 8
}
