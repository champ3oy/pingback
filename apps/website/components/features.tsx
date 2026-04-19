const features = [
  {
    title: "Automatic Retries",
    description:
      "Configurable retry policies with exponential backoff. Jobs recover from transient failures without intervention.",
  },
  {
    title: "Execution Logs",
    description:
      "Structured logging via ctx.log(). Search and filter logs across all jobs in the dashboard.",
  },
  {
    title: "Fan-Out Tasks",
    description:
      "Spawn independent sub-tasks with ctx.task(). Each runs with its own retries, timeout, and tracking.",
  },
  {
    title: "Real-Time Monitoring",
    description:
      "Live execution status, duration tracking, and email alerts on failures. See every run in your dashboard.",
  },
];

export function Features() {
  return (
    <section id="features" className="border-b">
      <div className="max-w-5xl mx-auto border-x">
        <div className="py-20 px-6 text-center">
          <h2 className="text-3xl font-bold tracking-tight mb-3">
            Everything you need for reliable background jobs
          </h2>
          <p className="text-muted-foreground max-w-lg mx-auto">
            Built for developers who need more than a basic cron scheduler.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 border-t">
          {features.map((feature, i) => (
            <div
              key={feature.title}
              className={`p-8 ${i % 2 === 0 ? "md:border-r" : ""} ${i < 2 ? "border-b" : ""}`}
            >
              <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
