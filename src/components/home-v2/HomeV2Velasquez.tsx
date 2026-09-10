/** A single pull quote, not a card. The grid of three quotecards lower down
 *  does the "several pastors say this" job; this one sits alone so it reads as
 *  a voice rather than as evidence in a list. */
const QUOTE_OPEN = "“Thank you for the work you put into Sermon Coach. ";
const QUOTE_LIFT = "I use it every week.";
const QUOTE_REST =
  " I have been able to put the feedback into practice and I notice the difference already. I can’t wait to share this tool with others.”";

export function HomeV2Velasquez() {
  return (
    <section className="section voice">
      <div className="container center">
        <figure>
          <blockquote>
            {QUOTE_OPEN}
            <span className="voice-lift">{QUOTE_LIFT}</span>
            {QUOTE_REST}
          </blockquote>
          <figcaption>
            <span className="voice-name">David Velasquez</span>
            <span className="voice-role">Pastor, Iglesia de Colmenar</span>
            <span className="voice-role">Seville, Spain</span>
          </figcaption>
        </figure>
      </div>
    </section>
  );
}
