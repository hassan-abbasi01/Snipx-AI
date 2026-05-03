import Hero from '../components/Hero';
import NewFeatures from '../components/New Features';
import HowItWorks from '../components/HowItWorks';
import Footer from '../components/Footer';
import HomeGuidedTour from '../components/HomeGuidedTour';

const Home = () => {
  return (
    <>
      <HomeGuidedTour />
      <Hero />
      <NewFeatures />
      <HowItWorks />
      <Footer />
    </>
  );
};

export default Home;