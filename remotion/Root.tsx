import { Composition } from "remotion";
import { HelloWorld, helloWorldCompSchema } from "./HelloWorld";
import { DocumentarioVideo, documentarioSchema } from "./DocumentarioVideo";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="HelloWorld"
        component={HelloWorld}
        durationInFrames={150}
        fps={30}
        width={1920}
        height={1080}
        schema={helloWorldCompSchema}
        defaultProps={{
          titleText: "Welcome to Remotion",
          titleColor: "#000000",
          logoColor1: "#91EAE4",
          logoColor2: "#86A8E7",
        }}
      />
      <Composition
        id="DocumentarioVideo"
        component={DocumentarioVideo}
        durationInFrames={300}
        fps={30}
        width={1920}
        height={1080}
        schema={documentarioSchema}
        calculateMetadata={async ({ props }) => ({
          durationInFrames: props.totalFrames,
          fps: props.fps,
        })}
        defaultProps={{
          cenas: [],
          totalFrames: 300,
          fps: 30,
          estiloGlobal: {
            corFundo: "#0a0a1a",
            corTexto: "#f5f0e8",
            corDestaque: "#c9a84c",
            fonte: "Georgia, serif",
            overlayOpacity: 0.6,
          },
          visualBriefing: "",
        }}
      />
    </>
  );
};
