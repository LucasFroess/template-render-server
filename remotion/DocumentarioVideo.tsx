import {
  AbsoluteFill,
  Audio,
  Img,
  Sequence,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { z } from "zod";

const cenaSchema = z.object({
  part_index: z.number(),
  audioUrl: z.string(),
  imageUrls: z.array(z.string()),
  durationInFrames: z.number(),
  texto: z.string(),
  transicao: z.string().default("fade"),
  animacaoTexto: z.string().default("fade-in"),
  posicaoTexto: z.string().default("bottom"),
  ritmo: z.string().default("lento"),
  kenBurns: z.boolean().default(true),
});

const estiloGlobalSchema = z.object({
  corFundo: z.string().default("#0a0a1a"),
  corTexto: z.string().default("#f5f0e8"),
  corDestaque: z.string().default("#c9a84c"),
  fonte: z.string().default("Georgia, serif"),
  overlayOpacity: z.number().default(0.6),
});

export const documentarioSchema = z.object({
  cenas: z.array(cenaSchema),
  totalFrames: z.number(),
  fps: z.number().default(30),
  estiloGlobal: estiloGlobalSchema,
  visualBriefing: z.string().optional(),
});

// Componente de uma cena individual
const Cena: React.FC<{
  cena: z.infer<typeof cenaSchema>;
  estilo: z.infer<typeof estiloGlobalSchema>;
  isLast: boolean;
}> = ({ cena, estilo, isLast }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();

  const totalImagens = cena.imageUrls.length;
  const framesPerImage = Math.floor(durationInFrames / totalImagens);
  const imagemAtual = Math.min(
    Math.floor(frame / framesPerImage),
    totalImagens - 1
  );

  // Ken Burns: velocidade baseada no ritmo
  const kenBurnsScale = cena.ritmo === "rapido" ? 1.08
    : cena.ritmo === "medio" ? 1.05
    : 1.03;

  const scale = cena.kenBurns
    ? interpolate(frame, [0, durationInFrames], [1, kenBurnsScale], {
        extrapolateRight: "clamp",
      })
    : 1;

  // Fade entre imagens
  const frameNaImagem = frame % framesPerImage;
  const fadeInImagem = interpolate(frameNaImagem, [0, 12], [0, 1], {
    extrapolateRight: "clamp",
  });

  // Fade out da cena (sempre suave na última, mais rápido nas outras)
  const fadeOutFrames = isLast ? 30 : 15;
  const fadeOutCena = interpolate(
    frame,
    [durationInFrames - fadeOutFrames, durationInFrames],
    [1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  // Fade in da cena
  const fadeInCena = interpolate(frame, [0, 20], [0, 1], {
    extrapolateRight: "clamp",
  });

  // Animação do texto
  const textoOpacity = cena.animacaoTexto === "fade-in"
    ? interpolate(frame, [25, 55], [0, 1], { extrapolateRight: "clamp" })
    : interpolate(frame, [20, 45], [0, 1], { extrapolateRight: "clamp" });

  const textoY = cena.animacaoTexto === "slide-up"
    ? interpolate(frame, [20, 45], [30, 0], { extrapolateRight: "clamp" })
    : cena.animacaoTexto === "slide-right"
    ? 0
    : 0;

  const textoX = cena.animacaoTexto === "slide-right"
    ? interpolate(frame, [20, 45], [-40, 0], { extrapolateRight: "clamp" })
    : 0;

  // Posição do texto
  const posicaoEstilo = cena.posicaoTexto === "center"
    ? { justifyContent: "center" as const, paddingBottom: 0, paddingTop: 0 }
    : { justifyContent: "flex-end" as const, paddingBottom: 60 };

  return (
    <AbsoluteFill
      style={{
        backgroundColor: estilo.corFundo,
        opacity: Math.min(fadeInCena, fadeOutCena),
      }}
    >
      {/* Imagem de fundo */}
      <AbsoluteFill
        style={{
          transform: `scale(${scale})`,
          opacity: fadeInImagem,
        }}
      >
        <Img
          src={cena.imageUrls[imagemAtual]}
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
      </AbsoluteFill>

      {/* Overlay gradiente */}
      <AbsoluteFill
        style={{
          background: cena.posicaoTexto === "center"
            ? `rgba(0,0,0,${estilo.overlayOpacity})`
            : `linear-gradient(to top, rgba(0,0,0,${estilo.overlayOpacity + 0.2}) 0%, rgba(0,0,0,${estilo.overlayOpacity}) 35%, transparent 70%)`,
        }}
      />

      {/* Áudio */}
      <Audio src={cena.audioUrl} />

      {/* Texto */}
      <AbsoluteFill
        style={{
          ...posicaoEstilo,
          alignItems: "center",
          paddingLeft: 100,
          paddingRight: 100,
          opacity: textoOpacity,
          transform: `translateY(${textoY}px) translateX(${textoX}px)`,
        }}
      >
        <p
          style={{
            color: estilo.corTexto,
            fontSize: 38,
            fontFamily: estilo.fonte,
            textAlign: "center",
            lineHeight: 1.6,
            textShadow: "0 2px 12px rgba(0,0,0,0.95)",
            maxWidth: 1400,
            margin: 0,
            borderLeft: cena.posicaoTexto === "center"
              ? `4px solid ${estilo.corDestaque}`
              : "none",
            paddingLeft: cena.posicaoTexto === "center" ? 30 : 0,
          }}
        >
          {cena.texto}
        </p>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// Componente principal
export const DocumentarioVideo: React.FC
  z.infer<typeof documentarioSchema>
> = ({ cenas, fps, estiloGlobal }) => {
  let frameOffset = 0;
  const cenasComOffset = cenas.map((cena) => {
    const offset = frameOffset;
    frameOffset += cena.durationInFrames;
    return { ...cena, offset };
  });

  return (
    <AbsoluteFill style={{ backgroundColor: estiloGlobal.corFundo }}>
      {cenasComOffset.map((cena, index) => (
        <Sequence
          key={cena.part_index}
          from={cena.offset}
          durationInFrames={cena.durationInFrames}
        >
          <Cena
            cena={cena}
            estilo={estiloGlobal}
            isLast={index === cenasComOffset.length - 1}
          />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};
EOF
