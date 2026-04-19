import { createFileRoute, Link } from '@tanstack/react-router'
import { BootLine, CornerBracket } from '@/components/magi/terminal'
import { FlowCanvas } from '@/components/configure/flow-canvas'
import { useAgentNames } from '@/utils/use-agent-names'

export const Route = createFileRoute('/')({
  component: LandingPage,
})

const MONO_STACK =
  'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace'
const BG = 'oklch(0.14 0 0)'
const FG = 'oklch(0.92 0 0)'
const MUTED = 'oklch(0.55 0 0)'
const AMBER = 'oklch(0.78 0.07 70)'

function LandingFlowDiagram({
  melchior,
  balthasar,
  casper,
}: {
  melchior: string
  balthasar: string
  casper: string
}) {
  return (
    <div className="relative h-full w-full">
      <div className="absolute top-5 left-5 bottom-10 right-5">
        <CornerBracket position="tl" className="h-4 w-4" />
        <CornerBracket position="tr" className="h-4 w-4" />
        <CornerBracket position="bl" className="h-4 w-4" />
        <CornerBracket position="br" className="h-4 w-4" />
      </div>

      <div
        className="absolute inset-10 flex flex-col border"
        style={{ borderColor: 'oklch(0.25 0 0)' }}
      >
        <div
          className="flex shrink-0 items-center justify-between border-b px-4 py-2 text-[11px] uppercase tracking-[0.28em]"
          style={{ borderColor: 'oklch(0.22 0 0)', color: MUTED }}
        >
          <span style={{ color: AMBER }}>&gt; TRILATERAL CORES</span>
          <span>:: ONLINE</span>
        </div>

        <div className="flex min-h-0 flex-1">
          <FlowCanvas
            nodeNames={{
              top: melchior,
              'bottom-left': balthasar,
              'bottom-right': casper,
            }}
          />
        </div>

        <div
          className="shrink-0 border-t px-4 py-2 text-center text-[11px] uppercase tracking-[0.28em]"
          style={{ borderColor: 'oklch(0.22 0 0)', color: MUTED }}
        >
          &gt; Three cores, one consensus
        </div>
      </div>
    </div>
  )
}

function LandingPage() {
  const { melchior, balthasar, casper } = useAgentNames()

  return (
    <div
      className="relative flex h-svh w-full flex-col overflow-hidden"
      style={{
        background: BG,
        color: FG,
        fontFamily: MONO_STACK,
      }}
    >
      <style>{`
        @keyframes magi-blink {
          0%, 49% { opacity: 0.65; }
          50%, 100% { opacity: 0; }
        }
        .magi-caret {
          display: inline-block;
          animation: magi-blink 1.1s step-end infinite;
          color: ${AMBER};
          margin-left: 2px;
        }
        .magi-ascii {
          font-family: ${MONO_STACK};
          color: ${AMBER};
          font-size: 22px;
          line-height: 1;
          letter-spacing: 0;
          white-space: pre;
          margin: 0;
        }
        @media (min-width: 1024px) {
          .magi-ascii { font-size: 28px; }
        }
        .magi-cta {
          border: 1px solid ${AMBER};
          color: ${AMBER};
          transition: background-color 160ms ease, color 160ms ease;
        }
        .magi-cta:hover {
          background-color: color-mix(in oklch, ${AMBER} 12%, transparent);
        }
      `}</style>

      <main className="relative z-10 grid flex-1 grid-cols-1 gap-10 px-10 py-10 lg:grid-cols-[1.1fr_1fr] lg:gap-14 lg:px-16 lg:py-14">
        <section className="flex flex-col justify-center">
          <pre
            aria-label="MAGI"
            className="magi-ascii select-none"
          >{`█   █  ███   ████  █
██ ██ █   █ █      █
█ █ █ █████ █  ██  █
█   █ █   █ █   █  █
█   █ █   █  ███   █`}</pre>

          <div className="mt-8 max-w-md space-y-1">
            <BootLine label="INIT MAGI.SYS" />
            <BootLine label={`LINK ${melchior.toUpperCase()}-1`} />
            <BootLine label={`LINK ${balthasar.toUpperCase()}-2`} />
            <BootLine label={`LINK ${casper.toUpperCase()}-3`} />
            <div
              className="flex items-baseline gap-2 pt-1 text-[13px] leading-6"
              style={{ color: MUTED }}
            >
              <span>&gt;</span>
              <span className="uppercase tracking-[0.12em]">
                AWAITING OPERATOR INPUT
              </span>
              <span className="magi-caret" aria-hidden>
                &#9612;
              </span>
            </div>
          </div>

          <div className="mt-10 max-w-md">
            <h2
              className="text-2xl font-semibold tracking-[0.14em]"
              style={{ fontFamily: 'var(--font-heading, inherit)', color: FG }}
            >
              TRILATERAL DECISION SYSTEM
            </h2>
            <p
              className="mt-3 text-sm leading-6"
              style={{ color: MUTED, fontFamily: 'var(--font-sans, inherit)' }}
            >
              Three independent cores deliberate every query. Compose, debate,
              and resolve prompts through the MAGI consensus protocol.
            </p>
          </div>

          <div className="mt-8">
            <Link
              to="/configure"
              className="magi-cta inline-flex items-center gap-3 px-5 py-2.5 text-[12px] tracking-[0.28em] uppercase"
            >
              <span>&gt;&gt; Enter Terminal</span>
            </Link>
          </div>
        </section>

        <section className="hidden lg:block">
          <LandingFlowDiagram
            melchior={melchior}
            balthasar={balthasar}
            casper={casper}
          />
        </section>
      </main>

      <footer
        className="relative z-10 flex h-8 items-center justify-center border-t px-6 text-[11px] tracking-[0.25em]"
        style={{ color: MUTED, borderColor: 'oklch(1 0 0 / 0.08)' }}
      >
        <span>
          KENNETH YANDELL &nbsp;&mdash;&nbsp; BRIAN LIEN &nbsp;&mdash;&nbsp; TIMMY PHAN
        </span>
      </footer>
    </div>
  )
}
