import { Button, type ButtonCompositionOptions, type ComposedButton } from "../button";
import { Icon, type ComposedNode } from "../composition";
import {
    accessibleFirstEnglishMessages,
    getLocaleText,
    type LocaleTextProvider
} from "../localization";

/** Account action presentation. Both variants retain native button semantics. */
export type AccountControlDisplay = "button" | "icon";

/** UI state supplied by the application, not an authorization decision. */
export interface AccountControlState {
    readonly signedIn: boolean;
    readonly pending: boolean;
}

/** Optional external state source. The application owns authentication and requests. */
export interface AccountControlStateSource {
    getState(): AccountControlState;
    subscribe(listener: () => void): () => void;
}

/** Localized fallback keys used by AccountControl. */
export type AccountControlMessageKey =
    | "pending.waitMessage"
    | "accountControl.signInLabel"
    | "accountControl.signOutLabel"
    | "accountControl.accountLabel";

/** Handler for the current account action; state changes require application confirmation. */
export type AccountControlOnAction = (event: Event, control: ComposedAccountControl) => void;

/** Options for the reusable account action, without server or storage dependencies. */
export interface AccountControlOptions extends Omit<
    ButtonCompositionOptions,
    "text" | "children" | "onPress" | "selected" | "pressed" | "reserveText" | "locale"
> {
    display?: AccountControlDisplay;
    signedIn?: boolean;
    pending?: boolean;
    source?: AccountControlStateSource | null;
    signInLabel?: string;
    signOutLabel?: string;
    accountLabel?: string;
    locale?: LocaleTextProvider<AccountControlMessageKey> | null;
    onSignIn?: AccountControlOnAction | null;
    onSignOut?: AccountControlOnAction | null;
}

/** Stable account button with explicit state updates and subscription cleanup. */
export interface ComposedAccountControl extends ComposedNode<HTMLButtonElement> {
    readonly button: ComposedButton;
    getState(): AccountControlState;
    update(options: Partial<AccountControlOptions>): void;
    destroy(): void;
}

const PROFILE_PATHS = [
    "M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2",
    "M16 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0"
] as const;

/** Creates a sign-in/sign-out action as a text button or a profile icon. */
export function AccountControl(options: AccountControlOptions = {}): ComposedAccountControl {
    let current = { ...options };
    let disposed = false;
    let unsubscribeSource: (() => void) | null = null;
    let unsubscribeLocale: (() => void) | null = null;
    let composed!: ComposedAccountControl;

    function getState(): AccountControlState {
        const state = current.source?.getState();
        return {
            signedIn: state?.signedIn ?? current.signedIn ?? false,
            pending: state?.pending ?? current.pending ?? false
        };
    }

    function onPress(event: Event): void {
        const state = getState();
        if (disposed || state.pending || current.disabled) return;
        const action = state.signedIn ? current.onSignOut : current.onSignIn;
        action?.(event, composed);
    }

    function getButtonOptions(): ButtonCompositionOptions {
        const {
            display = "button", signedIn: _signedIn, pending: _pending, source: _source,
            signInLabel, signOutLabel, accountLabel, locale,
            onSignIn: _onSignIn, onSignOut: _onSignOut, ...buttonOptions
        } = current;
        const state = getState();
        const signIn = signInLabel ?? getLocaleText(locale, "accountControl.signInLabel",
            accessibleFirstEnglishMessages["accountControl.signInLabel"]);
        const signOut = signOutLabel ?? getLocaleText(locale, "accountControl.signOutLabel",
            accessibleFirstEnglishMessages["accountControl.signOutLabel"]);
        const account = accountLabel ?? getLocaleText(locale, "accountControl.accountLabel",
            accessibleFirstEnglishMessages["accountControl.accountLabel"]);
        const label = state.signedIn ? signOut : signIn;

        return {
            variant: "ghost",
            hint: account,
            hintDisplay: "both",
            hintShowOnFocus: false,
            hintAnnounceOnHover: false,
            ...buttonOptions,
            disabled: current.disabled === true,
            pending: state.pending,
            locale: locale ?? null,
            attributes: {
                ...current.attributes,
                "data-af-account-control": "",
                "data-af-account-control-display": display,
                "data-af-account-control-signed-in": String(state.signedIn),
                "aria-label": display === "icon" ? label : current.attributes?.["aria-label"] ?? null
            },
            ...(display === "icon"
                ? { children: [Icon({ path: PROFILE_PATHS, variant: "outline", size: "1.25rem" })], reserveText: null }
                : { text: label, reserveText: [signIn, signOut] }),
            onPress
        };
    }

    const button = Button(getButtonOptions());
    const sync = (): void => { if (!disposed) button.update(getButtonOptions()); };

    function subscribe(): void {
        unsubscribeSource?.();
        unsubscribeLocale?.();
        unsubscribeSource = current.source?.subscribe(sync) ?? null;
        unsubscribeLocale = current.locale?.subscribe?.(sync) ?? null;
    }

    composed = {
        element: button.element,
        button,
        getState,
        update(nextOptions): void {
            if (disposed) return;
            current = { ...current, ...nextOptions };
            if ("source" in nextOptions || "locale" in nextOptions) subscribe();
            sync();
        },
        destroy(): void {
            if (disposed) return;
            disposed = true;
            unsubscribeSource?.();
            unsubscribeLocale?.();
            button.destroy();
        }
    };
    subscribe();
    sync();
    return composed;
}
