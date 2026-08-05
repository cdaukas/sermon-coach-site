"use client";

/**
 * Shared help surface under the New evaluation sermon input block.
 * One copy source for collapsed help and fetch-failure routing.
 */

export type TranscriptHelpTabId =
  | "youtube-captions"
  | "no-captions"
  | "audio-other";

export const TRANSCRIPT_HELP_TABS: {
  id: TranscriptHelpTabId;
  label: string;
}[] = [
  { id: "youtube-captions", label: "YouTube captions" },
  { id: "no-captions", label: "No captions" },
  { id: "audio-other", label: "Audio or other video" },
];

const uiFont = { fontFamily: "var(--font-ui)" };

type TranscriptHelpProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  activeTab: TranscriptHelpTabId;
  onActiveTabChange: (tab: TranscriptHelpTabId) => void;
};

function BodyText({ children }: { children: React.ReactNode }) {
  return (
    <p
      className="m-0 text-[14px] leading-relaxed"
      style={{ ...uiFont, color: "var(--sc-ink)" }}
    >
      {children}
    </p>
  );
}

function YoutubeCaptionsRoute() {
  return (
    <div className="flex flex-col gap-3">
      <BodyText>
        Captions usually appear within two to four hours of upload, sometimes longer on
        a long stream. If you posted recently, try Fetch again later. To get started now,
        copy the transcript by hand:
      </BodyText>
      <ol
        className="m-0 flex list-decimal flex-col gap-1.5 pl-5 text-[14px] leading-relaxed"
        style={{ ...uiFont, color: "var(--sc-ink)" }}
      >
        <li>Open the video on YouTube.</li>
        <li>Under the player, open the menu with three dots.</li>
        <li>Choose Show transcript.</li>
        <li>
          In the transcript panel, open the three-dot menu and turn timestamps off.
        </li>
        <li>Select all, copy, and paste into the text box above.</li>
      </ol>
      <BodyText>
        If captions never show up, the uploader may have turned them off. Use the No
        captions tab for a free transcription tool.
      </BodyText>
    </div>
  );
}

function NoCaptionsRoute() {
  return (
    <div className="flex flex-col gap-3">
      <BodyText>
        Some videos never get captions we can read, including when the uploader turns
        them off.
      </BodyText>
      <BodyText>
        Use a free transcription tool such as Otter.ai. Upload the recording, copy the
        text it returns, and paste it into the box above. The free tier handles a sermon.
      </BodyText>
    </div>
  );
}

function AudioOrOtherVideoRoute() {
  return (
    <div className="flex flex-col gap-3">
      <BodyText>
        If you have a phone recording, booth mix, Facebook stream, or any file that is not
        a YouTube link with captions, use a free transcription tool such as Otter.ai.
      </BodyText>
      <BodyText>
        Upload the audio or video there, copy the text, and paste it into the box above.
      </BodyText>
      <BodyText>
        Once the text is in the box above, everything else works the same.
      </BodyText>
    </div>
  );
}

function RouteBody({ tab }: { tab: TranscriptHelpTabId }) {
  switch (tab) {
    case "youtube-captions":
      return <YoutubeCaptionsRoute />;
    case "no-captions":
      return <NoCaptionsRoute />;
    case "audio-other":
      return <AudioOrOtherVideoRoute />;
  }
}

export function TranscriptHelp({
  open,
  onOpenChange,
  activeTab,
  onActiveTabChange,
}: TranscriptHelpProps) {
  return (
    <details
      className="group w-full"
      open={open}
      onToggle={(event) => {
        const nextOpen = event.currentTarget.open;
        if (nextOpen !== open) {
          onOpenChange(nextOpen);
        }
      }}
    >
      <summary
        className="flex cursor-pointer list-none items-center gap-2 py-1 text-[14px] font-medium hover:underline [&::-webkit-details-marker]:hidden"
        style={{ ...uiFont, color: "var(--sc-accent)" }}
      >
        <span
          aria-hidden="true"
          className="inline-block h-0 w-0 shrink-0 border-y-[4px] border-l-[6px] border-y-transparent border-l-current transition-transform group-open:rotate-90"
        />
        Need help getting your sermon text?
      </summary>

      <div
        className="mt-3 rounded border px-4 py-4"
        style={{
          borderColor: "var(--sc-rule)",
          background: "var(--sc-bg)",
        }}
      >
        <div
          className="mb-4 flex flex-wrap gap-x-5 gap-y-1"
          style={{ borderBottom: "1px solid var(--sc-rule)" }}
          role="tablist"
          aria-label="Transcript help routes"
        >
          {TRANSCRIPT_HELP_TABS.map((tab) => {
            const selected = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={selected}
                id={`transcript-help-tab-${tab.id}`}
                aria-controls={`transcript-help-panel-${tab.id}`}
                onClick={() => onActiveTabChange(tab.id)}
                className="border-0 bg-transparent px-0 pb-2.5 text-[13px] transition-colors"
                style={{
                  ...uiFont,
                  fontWeight: selected ? 600 : 500,
                  color: selected ? "var(--sc-ink)" : "var(--sc-ink-soft)",
                  borderBottom: selected
                    ? "2px solid var(--sc-accent)"
                    : "2px solid transparent",
                  marginBottom: "-1px",
                }}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {TRANSCRIPT_HELP_TABS.map((tab) => (
          <div
            key={tab.id}
            role="tabpanel"
            id={`transcript-help-panel-${tab.id}`}
            aria-labelledby={`transcript-help-tab-${tab.id}`}
            hidden={activeTab !== tab.id}
          >
            {activeTab === tab.id ? <RouteBody tab={tab.id} /> : null}
          </div>
        ))}
      </div>
    </details>
  );
}
