
import ChatPanel from "../../chat-panel/ChatPanel";
import PolityBook from "./PolityBook";

const PolityApp = () => {
  return (
    <div className="flex h-screen">
      <div className="flex-1">
        <PolityBook />
      </div>
      <div className="w-96">
        <ChatPanel />
      </div>
    </div>
  );
};

export default PolityApp;