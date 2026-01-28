import { Composition } from "remotion";
import { MainVideo } from "./MainVideo";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="AIMarketingDemo"
        component={MainVideo}
        durationInFrames={3600} // 120 seconds at 30fps
        fps={30}
        width={1920}
        height={1080}
      />
      {/* Short preview composition for testing */}
      <Composition
        id="Preview"
        component={MainVideo}
        durationInFrames={900} // 30 seconds preview
        fps={30}
        width={1920}
        height={1080}
      />
    </>
  );
};
