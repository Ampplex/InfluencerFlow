import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './index.css';
import Auth from '../pages/Auth';
import Navbar from '../components/Navbar';
import Landing from '../pages/Landing';
import CreateCampaign from '../pages/CreateCampaign';
import MatchedInfluencers from '../pages/MatchedInfluencers';

function App() {
  return (
    <Router>
      <Navbar />
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/auth" element={<Auth />} />
        <Route path="/create-campaign" element={<CreateCampaign />} />
        <Route path="/match_influencers" element={<MatchedInfluencers />} />
      </Routes>
    </Router>
  );
}

export default App;