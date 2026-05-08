import { ImageResponse } from 'next/og'

export const runtime = 'edge'

const COLORS = {
  cream: '#FFFCF5',
  ink: '#222222',
  body: '#484848',
  soft: '#888888',
  accent: '#FF6B35',
}

type Kind = 'home' | 'tool' | 'guide'

const EYEBROW: Record<Kind, string> = {
  home: 'lalupa.cl',
  tool: 'Herramienta',
  guide: 'Guía',
}

const VALID_CATEGORY = /^[A-Za-zÁÉÍÓÚáéíóúÑñ ]{1,20}$/

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const titleParam = searchParams.get('title')
  const kindParam = searchParams.get('kind') as Kind | null
  const categoryParam = searchParams.get('category')
  const title =
    titleParam && titleParam.length > 0
      ? titleParam.length > 110
        ? `${titleParam.slice(0, 107)}…`
        : titleParam
      : 'Lo que esconden bajo la letra chica'
  const kind: Kind =
    kindParam === 'guide' || kindParam === 'home' || kindParam === 'tool'
      ? kindParam
      : 'tool'
  const category =
    categoryParam && VALID_CATEGORY.test(categoryParam)
      ? categoryParam
      : null
  const eyebrow = category ? `${EYEBROW[kind]} · ${category}` : EYEBROW[kind]

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          background: COLORS.cream,
          padding: 80,
          fontFamily:
            'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            fontSize: 22,
            color: COLORS.soft,
            textTransform: 'uppercase',
            letterSpacing: 4,
          }}
        >
          <div
            style={{
              width: 12,
              height: 12,
              borderRadius: 12,
              background: COLORS.accent,
            }}
          />
          {eyebrow}
        </div>

        <div
          style={{
            fontSize: title.length > 60 ? 72 : 92,
            color: COLORS.ink,
            fontWeight: 600,
            lineHeight: 1.05,
            letterSpacing: -2,
            marginTop: 'auto',
            marginBottom: 40,
            display: 'flex',
          }}
        >
          {title}
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 18,
            borderTop: `1px solid ${COLORS.ink}1a`,
            paddingTop: 30,
          }}
        >
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 999,
              border: `3px solid ${COLORS.ink}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: COLORS.cream,
            }}
          >
            <div
              style={{
                width: 22,
                height: 22,
                borderRadius: 999,
                background: COLORS.accent,
              }}
            />
          </div>
          <div
            style={{
              fontSize: 38,
              color: COLORS.ink,
              fontWeight: 700,
              letterSpacing: -1,
              display: 'flex',
            }}
          >
            lalupa.cl
          </div>
          <div
            style={{
              marginLeft: 'auto',
              fontSize: 20,
              color: COLORS.body,
              display: 'flex',
            }}
          >
            Privado · en tu navegador
          </div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    },
  )
}
