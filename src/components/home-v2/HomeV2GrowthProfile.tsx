const BAR_HEIGHTS = [38, 44, 50, 57, 63, 68, 73, 79, 84, 90] as const;

const METRICS = [
  { label: "Biblical Faithfulness", score: "9.2", width: 92 },
  { label: "Gospel Clarity", score: "9.0", width: 90 },
  { label: "Expository Structure", score: "8.7", width: 87 },
  { label: "Application", score: "7.5", width: 75 },
] as const;

export function HomeV2GrowthProfile() {
  return (
    <section className="section" style={{ paddingTop: 20 }}>
      <div className="container">
        <div className="center">
          <div className="eyebrow">Your preaching growth profile</div>
          <h2>
            Don&apos;t just know how your sermon did. Know how you&apos;re
            developing.
          </h2>
          <p className="lead">
            Every sermon becomes part of a long-term picture of your strengths,
            blind spots, and next areas for growth.
          </p>
        </div>

        <div className="dashboard">
          <div className="dashhead">
            <div>
              <strong>18 Sermons Evaluated</strong>
              <br />
              <small>Your preaching development</small>
            </div>
            <div className="growth">↑ 17%</div>
          </div>
          <div className="dashbody">
            <div className="chart">
              <strong>Overall growth</strong>
              <div className="bars">
                {BAR_HEIGHTS.map((height, index) => (
                  <div
                    key={index}
                    className="bar"
                    style={{ height: `${height}%` }}
                  />
                ))}
              </div>
              <div className="labels">
                <span>Sermon 1</span>
                <span>Sermon 10</span>
                <span>Sermon 18</span>
              </div>
            </div>
            <div className="profile">
              <strong>Current profile</strong>
              {METRICS.map((metric) => (
                <div key={metric.label} className="metric">
                  <div className="metrictop">
                    <span>{metric.label}</span>
                    <b>{metric.score}</b>
                  </div>
                  <div className="track">
                    <div
                      className="fill"
                      style={{ width: `${metric.width}%` }}
                    />
                  </div>
                </div>
              ))}
              <div className="focus">
                <small>NEXT DEVELOPMENT FOCUS</small>
                <strong>Make application concrete.</strong>
                <p>
                  Your exposition is consistently strong. Your next opportunity
                  is moving from explanation to specific, memorable practice.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
