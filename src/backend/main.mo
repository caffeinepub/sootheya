import Map "mo:core/Map";
import Nat "mo:core/Nat";
import Text "mo:core/Text";
import Iter "mo:core/Iter";
import Time "mo:core/Time";
import Int "mo:core/Int";
import Runtime "mo:core/Runtime";
import Order "mo:core/Order";
import List "mo:core/List";

actor {
  var messageIdCounter = 0;

  type Message = {
    id : Nat;
    sessionId : Text;
    role : Text;
    content : Text;
    timestamp : Int;
  };

  module Message {
    public func compare(message1 : Message, message2 : Message) : Order.Order {
      Nat.compare(message1.id, message2.id);
    };
  };

  let messages = Map.empty<Text, List.List<Message>>();

  let crisisKeywords = [
    "suicide",
    "kill myself",
    "self harm",
    "want to die",
    "hurt myself",
  ];
  let stressKeywords = [
    "stress",
    "overwhelmed",
    "exhausted",
    "burnout",
    "too much",
  ];
  let lonelyKeywords = [
    "lonely",
    "alone",
    "isolated",
    "nobody cares",
  ];
  let anxietyKeywords = [
    "anxious",
    "anxiety",
    "overthinking",
    "panic",
    "worried",
  ];
  let sadnessKeywords = [
    "sad",
    "crying",
    "depressed",
    "hopeless",
    "empty",
    "numb",
  ];
  let relationshipKeywords = [
    "relationship",
    "breakup",
    "partner",
    "argument",
    "family",
  ];
  let angerKeywords = [
    "angry",
    "frustrated",
    "furious",
    "rage",
  ];
  let positiveKeywords = [
    "thank you",
    "feeling better",
    "happy",
    "grateful",
  ];

  let crisisResponses1 = [
    "Your feelings are valid, and I'm really sorry things are extremely painful right now. You don't have to go through this alone. If you ever feel at risk. There is help available - in the US, you can call 988 or text 741741 for immediate support. I'm here to listen!",
    "I'm really glad you feel comfortable sharing how you're feeling. You matter, and things can get better even if it doesn't always feel that way. If you ever find yourself in a really dark place, please reach out to the free, confidential crisis support available at 988 (call) or 741741 (texting). I'll stay here with you.",
    "It's incredibly brave of you to share these thoughts. I'm truly sorry for the pain you're feeling. If things get overwhelming, calling 988 or texting 741741 can connect you with supportive professionals. I'm not going anywhere - talk to me as long as you need.",
  ];
  let stressResponses1 = [
    "It sounds like things are really overwhelming for you right now, and that's tough. Remember to take a few slow, deep breaths - you don't have to have everything figured out at once. What would help you feel supported right now?",
    "I'm really sorry things feel so out of control at the moment. It's okay to pause, take a break, and just focus on the next thing. Would a short breathing exercise or grounding practice help you right now?",
    "It makes sense that you're feeling this way with so much going on. You're doing your best. Try to take a few deep breaths, and let's figure out what small step might make today a little easier for you.",
  ];
  let lonelyResponses1 = [
    "Loneliness can be so painful. I want you to know that your feelings matter and you're not truly alone. Together, we can talk through this. Is there anything you wish others understood about what you're going through?",
    "It's really hard to feel disconnected, and I'm here for you. You're valued and your presence makes a difference in this world. Let's focus on what might bring you even a small sense of comfort right now.",
    "Being alone with heavy feelings is tough, and it takes courage to share what you're experiencing. Let's explore ways to bring some connection or support into your life, even if it's just small steps. You matter.",
  ];
  let anxietyResponses1 = [
    "Anxiety can feel overwhelming, but try to remember you're safe and this feeling will pass. Take a few slow, deep breaths with me. If you look around, can you name 5 things you can see, touch, or hear right now? That can help bring you back to the present moment.",
    "Anxious thoughts are tough, but remind yourself that you're stronger than they seem. Take a minute to do some deep breathing (in for 4, hold for 4, out for 4). Focusing on your senses can also help ground you.",
    "It's completely normal to experience worry and fear sometimes. Try to focus on your breath, and know that this anxious moment will pass. If it feels helpful, let's identify some small steps that feel manageable right now.",
  ];
  let sadnessResponses1 = [
    "I'm really sorry you're feeling so down. Sadness is a tough emotion to sit with, but there's nothing wrong with feeling this way. If it helps to talk about why you're feeling this way, I'm here to listen.",
    "Tears and sadness are a natural part of being human, even if it feels overwhelming at times. Sometimes just letting the feelings out can bring a sense of relief. What do you need most right now to bring a little comfort?",
    "It's okay to not be okay sometimes. I'm holding space for you and wishing you peace during this difficult moment. If it feels supportive, we can talk through what's bringing up these emotions for you.",
  ];
  let relationshipResponses1 = [
    "Relationships can be really complex and challenging. It makes sense if you're feeling confused or hurt. If you'd like to share more about the situation, I'm here to listen without judgment.",
    "It's never easy navigating relationship struggles. You're not alone in this, and it's okay to reach out for support when things feel overwhelming. What parts of this situation are weighing on you the most?",
    "Talking about relationships takes courage, and you're strong for opening up about it. Let's explore your feelings together - sometimes that helps find the clarity you need to move forward.",
  ];
  let angerResponses1 = [
    "Anger is a healthy, valid emotion, but I know it can feel overwhelming. Try focusing on your breath - in for 4, hold for 4, out for 4. If you need to vent, I'm here to listen. What triggered your anger most recently?",
    "It's okay to express frustration, even when it feels intense. Try to take a few deep breaths and let the tension go with each exhale. If you want to talk about the situation, I'm here for you.",
    "Feeling angry is a normal part of life, so don't be too hard on yourself. Sometimes addressing anger slowly, with a focus on your physiological needs (food, rest, movement), can have a calming effect. Tell me more if it will help.",
  ];
  let positiveResponses1 = [
    "I'm really glad to hear you're feeling better! You're strong for working through challenging emotions and that's something to celebrate. If you need more support later, I'll be here.",
    "Thank you for your kind words - they mean a lot. I'm glad our conversation could offer comfort. Remember to keep focusing on what brings you peace and joy, no matter how small.",
    "Your gratitude and happiness are incredibly important. I'm happy to support you whenever you need. Keep focusing on your progress and well-being.",
  ];
  let defaultResponses1 = [
    "I'm here solely to support you, no matter what you're experiencing. There is no judgment - this is a safe place to talk things through.",
    "I'm so glad you reached out. Every emotion and experience you share is valid. I'm here to listen without judgment and to support you in any way you need.",
    "Holding space for big emotions is so important. Take all the time you need, and if there's something you want to talk about, I'm here for you.",
  ];

  func findCategory(message : Text) : ([Text], [Text]) {
    let lowercaseMessage = message.toLower();

    let crisisIter = crisisResponses1.values();
    for (keyword in crisisKeywords.values()) {
      if (lowercaseMessage.contains(#text keyword)) { return (crisisKeywords, crisisResponses1) };
    };

    let stressIter = stressResponses1.values();
    for (keyword in stressKeywords.values()) {
      if (lowercaseMessage.contains(#text keyword)) { return (stressKeywords, stressResponses1) };
    };

    let lonelyIter = lonelyResponses1.values();
    for (keyword in lonelyKeywords.values()) {
      if (lowercaseMessage.contains(#text keyword)) { return (lonelyKeywords, lonelyResponses1) };
    };

    let anxietyIter = anxietyResponses1.values();
    for (keyword in anxietyKeywords.values()) {
      if (lowercaseMessage.contains(#text keyword)) { return (anxietyKeywords, anxietyResponses1) };
    };

    let sadnessIter = sadnessResponses1.values();
    for (keyword in sadnessKeywords.values()) {
      if (lowercaseMessage.contains(#text keyword)) { return (sadnessKeywords, sadnessResponses1) };
    };

    let relationshipIter = relationshipResponses1.values();
    for (keyword in relationshipKeywords.values()) {
      if (lowercaseMessage.contains(#text keyword)) { return (relationshipKeywords, relationshipResponses1) };
    };

    let angerIter = angerResponses1.values();
    for (keyword in angerKeywords.values()) {
      if (lowercaseMessage.contains(#text keyword)) { return (angerKeywords, angerResponses1) };
    };

    let positiveIter = positiveResponses1.values();
    for (keyword in positiveKeywords.values()) {
      if (lowercaseMessage.contains(#text keyword)) { return (positiveKeywords, positiveResponses1) };
    };

    ([], defaultResponses1);
  };

  public shared ({ caller }) func sendMessage(sessionId : Text, userMessage : Text) : async Text {
    let messageId = messageIdCounter;
    messageIdCounter += 1;

    let messagesList = switch (messages.get(sessionId)) {
      case (null) {
        let newList = List.empty<Message>();
        messages.add(sessionId, newList);
        newList;
      };
      case (?list) { list };
    };

    let userMessageObj : Message = {
      id = messageId;
      sessionId;
      role = "user";
      content = userMessage;
      timestamp = Time.now();
    };

    messagesList.add(userMessageObj);

    let count = messagesList.size();

    let (category, responses) = findCategory(userMessage);

    let response = responses[(count % responses.size())];

    let assistantMessageObj : Message = {
      id = messageIdCounter;
      sessionId;
      role = "assistant";
      content = response;
      timestamp = Time.now();
    };

    messageIdCounter += 1;
    messagesList.add(assistantMessageObj);

    response;
  };

  public query ({ caller }) func getChatHistory(sessionId : Text) : async [Message] {
    switch (messages.get(sessionId)) {
      case (null) { [] };
      case (?list) { list.toArray().sort() };
    };
  };

  public shared ({ caller }) func clearChat(sessionId : Text) : async Bool {
    switch (messages.get(sessionId)) {
      case (null) { false };
      case (?_) {
        messages.remove(sessionId);
        let newList = List.empty<Message>();
        messages.add(sessionId, newList);
        true;
      };
    };
  };

  public query ({ caller }) func isRegistered() : async Bool {
    Runtime.trap("Feature not supported. Please delete frontend call.");
  };

  public query ({ caller }) func getAllProfiles() : async [Message] {
    Runtime.trap("Feature not supported. Please delete frontend call.");
  };

  public query ({ caller }) func getAllProfilesByEmail() : async [Message] {
    Runtime.trap("Feature not supported. Please delete frontend call.");
  };
};
