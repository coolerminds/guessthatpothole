import GameContainer from "@/components/GameContainer";
import Head from "next/head";

export default function Home() {
  return (
    <>
      <Head>
        <title>Guess That Pothole! - Fresno, CA</title>
        <meta
          name="description"
          content="Guess where Fresno's potholes are! A daily guessing game inspired by The Price Is Right."
        />
      </Head>
      <GameContainer />
    </>
  );
}
