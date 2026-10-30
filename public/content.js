export const domains = [
  { id: 'thinking', title: 'Thinking', icon: 'thought', description: 'Find your own point of view.', invitation: 'Give your thinking a little room.' },
  { id: 'attention', title: 'Attention', icon: 'focus', description: 'Choose what you let in.', invitation: 'Come back to what is here.' },
  { id: 'connection', title: 'Connection', icon: 'connection', description: 'Meet each other honestly.', invitation: 'Make room for another person.' },
  { id: 'embodiment', title: 'Embodiment', icon: 'body', description: 'Return to your senses.', invitation: 'There is a world beyond the screen.' },
  { id: 'creativity', title: 'Creativity', icon: 'spark', description: 'Follow what feels worth making.', invitation: 'Let curiosity lead for a moment.' }
];

const question = (key, title, description, placeholder, optional = false) => ({ key, title, description, placeholder, optional, type: 'text' });

export const practices = [
  {
    id: 'before-the-machine', chapter: 1, domain: 'thinking', duration: '5–8 min', title: 'Before you ask the machine',
    description: 'Begin with your own thinking. Then choose the help you actually want.',
    principle: 'Your first thought deserves a little space.',
    steps: [
      { type: 'first', title: 'Begin with yourself.', description: 'Bring a question, a decision, or something you are trying to say. Give your own voice the first turn.' },
      { type: 'intent', title: 'Choose the help you want.', description: 'You get to decide what assistance is for, and what stays yours.' },
      { type: 'compare', title: 'Notice what changed.', description: 'If you used another tool, bring its response back here. You can also continue with your own reflection.' },
      question('action', 'Take it into your life.', 'Choose one next step you are willing to own. Small and specific is enough.', 'The next thing I will do is…')
    ]
  },
  {
    id: 'whose-thought', chapter: 2, domain: 'thinking', duration: '4–6 min', title: 'Whose thought is this?',
    description: 'Look beneath a confident belief. Find the evidence, the inheritance, and the uncertainty.', principle: 'You can examine a belief without abandoning yourself.',
    steps: [
      question('belief', 'Choose one belief.', 'Pick something you feel sure about. It can be ordinary, personal, or something you recently read.', 'Something I believe is…'),
      question('evidence', 'What holds it up?', 'Separate what you have observed from what you were told. What source could you actually check?', 'My evidence is… My assumptions are…'),
      question('uncertainty', 'Leave room for a question.', 'What is still unknown? What evidence would make you reconsider?', 'What I cannot yet confirm is…'),
      question('action', 'Choose one thing to check.', 'Name a source, a conversation, or an observation that could help you learn more.', 'I will check…')
    ]
  },
  {
    id: 'your-attention', chapter: 3, domain: 'attention', duration: '3–5 min', title: 'Who has your attention?',
    description: 'Leave one moment unfilled. Notice what asks for you, and what you want to choose.', principle: 'You can leave a little room unfilled.',
    steps: [
      question('pull', 'What keeps pulling you away?', 'Notice a notification, a habit, an unfinished thought, or the urge to fill a quiet moment.', 'My attention keeps going to…'),
      question('notice', 'Make a little space.', 'Put the screen down for a moment if you can. Look around. Return when you are ready and describe what you noticed.', 'Without filling the moment, I noticed…'),
      question('action', 'Choose what gets the next moment.', 'What deserves your attention now? Name one practical boundary that would make room for it.', 'For the next little while, I choose…')
    ]
  },
  {
    id: 'still-a-body', chapter: 4, domain: 'embodiment', duration: '3–5 min', title: 'You still have a body',
    description: 'Step out of the explanation and into something you can directly experience.', principle: 'You are here, in a place, in a body.',
    steps: [
      question('senses', 'Notice where you are.', 'If comfortable, notice a sound, a texture, the light, or a point of contact. Choose what is accessible to you.', 'Right here, I notice…'),
      question('experience', 'Experience before explaining.', 'Try an ordinary moment: look out a window, taste something, stretch, or rest. You can stay still. Return and describe the experience in your own words.', 'The experience itself felt like…'),
      question('action', 'Listen to what you need.', 'What is one comfortable, practical thing you can offer yourself now?', 'What I need next is…')
    ]
  },
  {
    id: 'conversation-yours', chapter: 5, domain: 'connection', duration: '5–7 min', title: 'The conversation is still yours',
    description: 'Find words you can stand behind. Make room for the other person, too.', principle: 'A message is part of a relationship.',
    steps: [
      question('meaning', 'What do you want them to understand?', 'Choose a real conversation. You can describe it without names or identifying details.', 'What I want to communicate is…'),
      question('message', 'Write it in your own voice.', 'Let the first version be imperfect. Include what you feel, what you need, and what you can take responsibility for.', 'What I would say is…'),
      question('perspective', 'Make room for their perspective.', 'What do you know about their experience? What are you assuming? What could you ask instead?', 'What I understand is… What I need to ask is…'),
      question('action', 'Choose how to show up.', 'Read your message aloud. What will you keep, change, or choose to discuss in person?', 'My next step in this conversation is…')
    ]
  },
  {
    id: 'make-anyway', chapter: 6, domain: 'creativity', duration: '4–6 min', title: 'What will you make anyway?',
    description: 'Follow a small curiosity. Decide which parts of the making you want to experience.', principle: 'Something can be worth making before anyone sees it.',
    steps: [
      question('curiosity', 'What keeps catching your curiosity?', 'A sentence, a meal, a melody, a small project, a question. What would you like to make or explore?', 'I keep wanting to…'),
      question('process', 'Which part do you want to do yourself?', 'Choose where assistance could help and which part of the process you want to inhabit.', 'I want to experience… I could use help with…'),
      question('action', 'Give it a small beginning.', 'Choose something you can actually make or try next. You do not have to publish it.', 'I will begin by…')
    ]
  },
  {
    id: 'agreeing-to', chapter: 7, domain: 'thinking', duration: '5–7 min', title: 'What are you agreeing to?',
    description: 'Look at a tool through permission, privacy, accountability, and the choices people have.', principle: 'A useful tool is still worth examining.',
    steps: [
      question('tool', 'Choose a tool you use.', 'What does it help you do, and what does it ask of you?', 'This tool helps me… It asks for…'),
      question('tradeoff', 'Examine the agreement.', 'What information does it receive? Which decisions does it make? What can you decline or undo? Mark anything you cannot confirm.', 'What I can verify is… What I still need to check is…'),
      question('people', 'Who else is affected?', 'Consider the people whose work, information, access, or choices are involved. You may not know the answer yet.', 'Other people affected might include…'),
      question('action', 'Make one deliberate choice.', 'Choose a setting to review, a question to ask, or a boundary to put in place.', 'One thing I will change or investigate is…')
    ]
  },
  {
    id: 'all-this-for', chapter: 8, domain: 'creativity', duration: '5–8 min', title: 'What is all this for?',
    description: 'Consider what you want assistance to make room for in your actual life.', principle: 'Make room for a life you want to be present for.',
    steps: [
      question('alive', 'When do you feel present in your life?', 'Think of a particular moment. What were you doing? Who or what was there?', 'A moment I felt fully here was…'),
      question('room', 'What do you want more room for?', 'Consider connection, curiosity, contribution, rest, work, or an experience that matters to you.', 'I want more room for…'),
      question('agreement', 'Make an agreement with yourself.', 'What will you delegate? What will you keep practicing? Where do you want to be personally present?', 'I will delegate… I will keep practicing… I will be present for…'),
      question('action', 'Begin in an ordinary way.', 'Choose one action that brings this agreement into today.', 'Today, that looks like…')
    ]
  }
];

export const chapterPreviews = [
  ['Before you ask the machine', 'There is a moment before the question leaves you. A small space between not knowing and asking something else to know. This chapter begins there.', 'You might be trying to write a difficult message, understand an idea, or make a choice. Before asking for help, give yourself a first turn. What do you already think? What do you feel? What would you like help to examine? Your first version can be unfinished. It gives you something of your own to return to.'],
  ['Whose thought is this?', 'Some beliefs arrive through experience. Others arrive through repetition, inheritance, or a voice that sounds certain. It is worth getting curious about the difference.', 'Choose a belief and trace its path. Ask where it came from, what evidence supports it, and what remains unknown. You can give an idea serious attention while leaving room to revise it.'],
  ['Who has your attention?', 'An ordinary day contains small invitations: a screen, a sound, a person, a task, a quiet moment. This chapter asks how you want to meet them.', 'Experiment with leaving one interval unfilled. Notice your impulse to reach for something. Notice your surroundings, too. Then choose what deserves the next moment.'],
  ['You still have a body', 'You live somewhere. Light falls across that place. Your body makes contact with it. There is something to notice before you search for an explanation.', 'An experience can be as ordinary as tasting a meal or looking out a window. Give it your attention in a way that is comfortable and accessible to you. Consider what you learn by being there.'],
  ['The conversation is still yours', 'You may find help with the words. You are still the person who sends them, hears the reply, and participates in what follows.', 'Consider the difference between a message that sounds good and a message you can stand behind. Make room for honesty, reciprocity, boundaries, and the other person’s experience.'],
  ['What will you make anyway?', 'Think of something you would like to make before you know whether anyone will see it. What draws you toward it?', 'Look at the process as well as the result. Decide where help serves your intention and which parts you want to experience yourself. Give curiosity a small, practical beginning.'],
  ['What are you agreeing to?', 'A tool participates in a wider system of people, information, work, and choices. This chapter invites you to look at that agreement closely.', 'Ask what you can verify about permission, privacy, accountability, and access. Consider who benefits and who carries a burden. When you do not know, leave a clear question instead of filling the gap with certainty.'],
  ['What is all this for?', 'Time saved opens a question: what would you like to make room for? The answer belongs in the life you are actually living.', 'Consider the experiences, relationships, work, rest, and contributions that matter to you. Make an agreement about what you will delegate, what you will keep practicing, and what deserves your presence.']
];

export const helpOptions = [
  { id: 'clarify', title: 'Clarify', description: 'Help me express what I mean.', request: 'Help me clarify my own thinking. Ask questions where my meaning is unclear.' },
  { id: 'challenge', title: 'Challenge', description: 'Show me what I might be missing.', request: 'Challenge my assumptions and identify gaps. Distinguish evidence from interpretation.' },
  { id: 'organize', title: 'Organize', description: 'Give my thinking some structure.', request: 'Help me organize these thoughts while preserving my intention and voice.' },
  { id: 'explore', title: 'Explore', description: 'Offer another way to look at it.', request: 'Offer alternative perspectives for me to consider, including uncertainty and trade-offs.' }
];
