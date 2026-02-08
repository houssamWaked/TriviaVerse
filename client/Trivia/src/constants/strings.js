export const STRINGS = {
  COMMON: {
    appName: 'TriviaVerse',
    playerFallback: 'Player',
    loading: 'Loading…',
    backHome: 'Back to Home',
    joinLogin: 'Join / Login',
    logout: 'Logout',
    joinNow: 'Join Now!',
    visibility: {
      private: 'private',
      public: 'public',
      unlisted: 'unlisted',
    },
    errors: {
      generic: 'Something went wrong. Please try again.',
      unauthorized: 'Please login to continue.',
    },
    separators: {
      emDash: '—',
      dot: '•',
      infinity: '∞',
      middot: '·',
      copyright: '©',
    },
    units: {
      secondsShort: 's',
    },
    symbols: {
      exclamation: '!',
      leftArrow: '←',
      hash: '#',
    },
    buttons: {
      close: 'Close',
      refresh: 'Refresh',
      home: 'Home',
      back: 'Back',
      delete: 'Delete',
      saveChanges: 'Save changes',
      publish: 'Publish',
      start: 'Start',
      playNow: 'Play Now!',
    },
  },

  NAV: {
    story: 'Story',
    quizzes: 'Quizzes',
    myPlays: 'My Plays',
    friends: 'Friends',
    profile: 'Profile',
    duels: 'Duels',
    admin: 'Admin',
    leaderboard: 'Leaderboard',
    createQuiz: 'Create Quiz',
  },

  PROFILE: {
    aria: { avatar: 'User avatar' },
    initialsFallback: '?',
    header: {
      loading: 'Loading your progress…',
      subtitle: 'Your progress across all modes',
    },
    locked: {
      title: 'Profile is locked',
      subtitle: 'Log in to see your progress in every game mode.',
    },
    pills: {
      level: 'Level',
      xp: 'XP',
      streak: 'Streak',
      streakSuffix: 'd',
      story: 'Story',
    },
    modes: {
      story: 'Story Mode',
      classic: 'Classic',
      blitz: 'Blitz',
      millionaire: 'Millionaire',
      custom: 'Custom Quizzes',
    },
    stats: {
      played: 'Played',
      completed: 'Completed',
      best: 'Best',
      lastPlayed: 'Last played',
    },
    customBest: {
      title: 'Custom Quiz Best Scores',
      subtitle: 'Your best scores per quiz.',
      updatedPrefix: 'Updated',
      empty: 'No custom quiz scores yet.',
    },
    plays: {
      title: 'Played Quizzes',
      subtitle: 'Your recent custom quiz performance.',
      searchPlaceholder: 'Search played quizzesâ€¦',
      empty: 'No played quizzes yet.',
    },
    duels: {
      title: 'Duels',
      subtitle: 'Your 1v1 custom quiz history.',
      vsPrefix: 'vs',
      empty: 'No duels yet â€” start one from a quiz page.',
      buttons: {
        open: 'Open',
        accept: 'Accept',
        decline: 'Decline',
        cancel: 'Cancel',
      },
      result: {
        youWon: 'You won',
        youLost: 'You lost',
        tie: 'Tie',
      },
    },
  },

  HOME: {
    badge: {
      text: '1M+ Players Worldwide!',
    },
    hero: {
      titleTop: "Let's Play",
      titleTrivia: 'Trivia',
      subtitleLine1: 'Test your brain, challenge friends, and become a quiz',
      subtitleLine2: 'champion!',
    },
    ctas: {
      startPlaying: 'Start Playing!',
      createQuiz: 'Create Quiz',
    },
    stats: {
      activePlayers: 'Active Players',
      questions: 'Questions',
      quizzesCreated: 'Quizzes Created',
      funLevel: 'Fun Level',
    },
    statsDefaults: {
      active_players: '1M+',
      questions: '50K+',
      quizzes_created: '25K+',
      fun_level: '100%',
    },
    modes: {
      title: 'Choose Your Game!',
      subtitle: "Pick a mode and let's get started!",
      storyTitle: 'Story Mode',
      storyDesc: 'Level up through epic challenges!',
      millionaireTitle: 'Millionaire',
      millionaireDesc: 'Win big with lifelines!',
      classicTitle: 'Classic Quiz',
      classicDesc: 'Pick your category!',
      blitzTitle: '60s Blitz',
      blitzDesc: 'Speed is everything!',
    },
    banner: {
      title: 'Create Your Own Quiz!',
      subtitle: 'Make it fun, make it yours, share with the world!',
      cta: 'Start Creating!',
    },
    features: {
      lightningTitle: 'Lightning Fast',
      lightningDesc: 'Quick rounds, instant fun!',
      rewardsTitle: 'Win Rewards',
      rewardsDesc: 'Earn badges & trophies!',
      togetherTitle: 'Play Together',
      togetherDesc: 'Challenge your friends!',
    },
  },

  FOOTER: {
    madeWith: 'Made with',
    by: 'by',
    year: '2026',
    tagline: 'Keep learning, keep playing!',
  },

  AUTH: {
    badge: 'Join the fun',
    welcomePrefix: 'Welcome to',
    leftSubtitle:
      'Play with friends, earn rewards, and create quizzes that go viral.',
    perks: {
      leaderboard: 'Climb the leaderboard',
      badges: 'Unlock badges & streaks',
      createQuiz: 'Create your own quiz',
    },
    leftFooter: 'One account, all modes',
    header: {
      login: 'Login',
      signup: 'Sign up',
    },
    subtitle: {
      login: "Welcome back — let's keep your streak going.",
      signup: 'Create your account in seconds.',
    },
    fields: {
      username: 'Username',
      email: 'Email',
      password: 'Password',
      confirmPassword: 'Confirm password',
    },
    placeholders: {
      username: 'coolplayer123',
      email: 'you@example.com',
      password: '••••••••',
    },
    errors: {
      passwordMismatch: "Passwords don't match.",
    },
    submit: {
      working: 'Working...',
      createAccount: 'Create account',
    },
    alt: {
      dontHave: "Don't have an account?",
      alreadyHave: 'Already have an account?',
    },
  },

  MILLIONAIRE: {
    aria: {
      crown: 'Crown',
    },
    title: 'Millionaire Mode',
    subtitle: 'Answer 15 questions to win €1,000,000.',
    lifelinesEnabled: 'Lifelines enabled',
    rulesTitle: 'Rules',
    rules: [
      'Answer 15 multiple choice questions',
      'Use three lifelines: 50:50, Phone a Friend, Ask the Audience',
      'One wrong answer ends the game',
      'Walk away at any time with your current winnings',
    ],
    ladder: {
      toggleShow: 'Show advanced ladder',
      toggleHide: 'Hide advanced ladder',
      configLabel: 'Ladder config',
      currentPrefix: 'Current:',
      defaultName: 'Default',
    },
    buttons: {
      startGame: 'Start Game',
    },
  },

  BLITZ: {
    aria: {
      lightning: 'Lightning',
    },
    title: '60-Second Blitz',
    subtitle: (seconds) =>
      `Answer as many questions as you can in ${seconds} seconds!`,
    howToPlayTitle: 'How to Play',
    howToPlay: {
      onClock: (seconds) => `You have ${seconds} seconds on the clock`,
      rapidFire: 'Answer rapid-fire questions as fast as possible',
      correctAdds: 'Each correct answer adds to your score',
      wrongNoPenalty: "Wrong answers don't penalize, just keep going!",
      speedAccuracy: 'Speed and accuracy both matter',
    },
    difficultyTitle: 'Difficulty',
    difficulty: {
      easy: 'Easy',
      medium: 'Medium',
      hard: 'Hard',
      range: {
        easy: '1–4',
        medium: '4–7',
        hard: '8–10',
      },
      selected: (label, range) => `Selected: ${label} (question level ${range})`,
    },
    stats: {
      timeLimit: 'Time Limit',
      paced: 'Paced',
      questions: 'Questions',
      fast: 'Fast',
      questionsCount: '15+',
    },
    formatSeconds: (seconds) => `${seconds}s`,
    buttons: {
      start: 'Start Blitz',
    },
  },

  PLAY: {
    backToStory: 'Back to story',
    backToQuizzes: 'Back to quizzes',
    backToDuels: 'Back to duels',
  },

  DUELS: {
    title: 'Duels',
    subtitle: 'Challenge a friend on a custom quiz. Winner = correct answers, then speed.',
    locked: {
      title: 'Duels are locked',
      subtitle: 'Log in to challenge your friends in 1v1 custom quiz duels.',
    },
    create: {
      title: 'Create a Challenge',
      subtitle: 'Pick a friend and one of your published quizzes.',
      friendPlaceholder: 'Select friend…',
      quizPlaceholder: 'Select published quiz…',
      needPublished: 'Publish a quiz first to start duels.',
      button: 'Send challenge',
    },
    list: {
      title: 'Your Duels',
      subtitle: 'Pending, active, and completed challenges.',
      empty: 'No duels yet — send a challenge above.',
    },
    quizFallback: 'Custom Quiz',
    vs: (name) => `vs ${name}`,
    status: (s) => {
      if (s === 'pending') return 'pending';
      if (s === 'active') return 'active';
      if (s === 'completed') return 'completed';
      if (s === 'declined') return 'declined';
      if (s === 'canceled') return 'canceled';
      return s || 'unknown';
    },
    actions: {
      accept: 'Accept',
      decline: 'Decline',
      cancel: 'Cancel',
      play: 'Play',
    },
    result: {
      tie: 'Tie',
      challengerWon: 'Challenger won',
      opponentWon: 'Opponent won',
    },
    perf: (correct, seconds, total) => `${correct}/${total} correct · ${seconds}s`,
  },

  DUEL_PLAY: {
    locked: 'Login required to play duels.',
    waiting: 'Waiting for the duel to start…',
    title: (pct) => `Duel · ${pct}%`,
    pills: {
      score: 'Score',
      q: 'Q',
      startsIn: 'Starts in',
      finished: 'Finished',
    },
    pointClaimed: 'Point claimed',
    youWonPoint: 'You got the point!',
    opponentWonPoint: 'Opponent got the point',
  },

  LEADERBOARD: {
    title: 'Leaderboard',
    headline: 'Top Players',
    subtitle: "Pick a mode and see who's dominating right now.",
    buttons: {
      home: 'Home',
      refresh: 'Refresh',
    },
    periods: {
      allTime: 'all_time',
      weekly: 'weekly',
    },
    modes: {
      global: 'global',
      story: 'story',
      millionaire: 'millionaire',
      classic: 'classic',
      blitz: 'blitz',
      custom: 'custom',
    },
    empty: {
      none: 'No leaderboard entries yet.',
    },
    level: {
      label: 'Level',
    },
  },

  CLASSIC: {
    aria: {
      close: 'Close',
    },
    badge: {
      text: 'Classic Mode',
    },
    title: 'Choose Your Category',
    subtitle:
      'Select a category and test your knowledge across various topics. Each category has hundreds of questions.',
    questionsAvailable: (count) =>
      count != null ? `${count} questions available` : 'Questions available',
    stats: {
      categories: 'Categories',
      totalQuestions: 'Total Questions',
      endlessFun: 'Endless Fun',
    },
    advanced: {
      title: 'Advanced settings',
      questionsLabel: 'Questions',
      currentPrefix: 'Current:',
      questionsSuffix: 'questions',
    },
    difficulty: {
      options: ['easy', 'medium', 'hard'],
    },
    status: {
      loggedInAs: (username) => `Logged in as ${username}. Tap a category to start.`,
      loginRequired: 'Login required to start. Tap any category to login.',
    },
  },

  MY_PLAYS: {
    locked: {
      title: 'Login to see your plays',
      subtitle: "We'll show every quiz you played and your best score.",
    },
    badge: {
      text: 'My plays',
    },
    titlePrefix: 'Your best',
    titleAccent: 'scores',
    subtitle: 'Click any quiz to play again and beat your record.',
    searchPlaceholder: 'Search by quiz title…',
    empty: 'No plays yet — open a quiz and press Play',
    visibility: {
      private: 'private',
      public: 'public',
    },
  },

  DISCOVER_QUIZZES: {
    badge: {
      text: 'Discover quizzes',
    },
    titlePrefix: 'Find the',
    titleAccent: 'best',
    titleSuffix: 'quizzes',
    subtitle:
      'Search by name — results are sorted by rating, so the best rise to the top.',
    note: {
      loggedOut: 'Login to also see private quizzes shared with you.',
      loggedIn: 'Private quizzes shared with you can appear here.',
    },
    placeholder: {
      loggedOut: 'Search public quizzes by title…',
      loggedIn: 'Search quizzes by title (includes private shared with you)…',
    },
    buttons: {
      search: 'Search',
    },
    ownerUnknown: 'Unknown',
    empty: {
      title: 'Top quizzes ✨',
      loading: 'Loading…',
      noQuizzes:
        'No quizzes yet — publish some quizzes and ratings will rank them here.',
    },
    openHint: 'Open →',
  },

  FRIENDS: {
    locked: {
      title: 'Login to add friends',
      subtitle:
        'Add friends, share private quizzes automatically, and compare stats.',
    },
    badge: {
      text: 'Friends',
    },
    titlePrefix: 'Build your',
    titleAccent: 'crew',
    subtitle:
      'Private quizzes become shareable to your friends automatically. Also peek at their best custom quiz scores.',
    buttons: {
      send: 'Send',
      accept: 'Accept',
      decline: 'Decline',
      cancel: 'Cancel',
    },
    add: {
      title: 'Add a friend',
      subtitle: 'Type a username and send a request.',
      placeholder: 'Username…',
      tip: 'Tip: if they already requested you, sending will auto-accept.',
    },
    requests: {
      title: 'Requests',
      subtitle: 'Incoming and outgoing requests.',
      incoming: 'Incoming',
      outgoing: 'Outgoing',
      noneIncoming: 'No incoming requests.',
      noneOutgoing: 'No outgoing requests.',
      sentPrefix: 'Sent',
    },
    list: {
      title: 'Your friends',
      subtitle: 'Click a friend to open their profile.',
      openHint: 'Open →',
      none: 'No friends yet. Add someone!',
      unknown: 'Unknown',
      friendFallback: 'Friend',
    },
  },

  FRIEND_PROFILE: {
    locked: {
      title: 'Login to view profiles',
      subtitle:
        'Compare stats, see best scores, and share private quizzes with your friends.',
    },
    buttons: {
      backToFriends: 'Friends',
    },
    aria: {
      avatar: 'Avatar',
    },
    header: {
      loading: 'Loading…',
      title: 'Friend profile',
    },
    pills: {
      level: 'Level',
      xp: 'XP',
      streak: 'Streak',
      streakSuffix: 'd',
    },
    section: {
      bestScoresTitle: 'Best custom quiz scores',
      bestScoresSubtitle: 'Tap a quiz to open it (if you have access).',
      updatedPrefix: 'Updated',
      noneScores: 'No custom quiz scores yet.',
    },
    initialsFallback: 'P',
    nameFallback: 'Friend',
  },

  QUIZ_VIEW: {
    buttons: {
      back: 'Back',
      play: 'Play',
      duel: 'Duel',
      edit: 'Edit',
      loginToView: 'Login to view',
    },
    duel: {
      title: 'Challenge a friend',
      subtitle: 'Winner is based on correct answers + speed.',
      needPublished: 'This quiz must be published to start a duel.',
      friendPlaceholder: 'Select a friend',
      send: 'Send challenge',
      noFriends: 'No friends found â€” add friends first.',
    },
    states: {
      loading: 'Loading…',
      notFound: 'Not found',
    },
    ownerUnknown: 'Unknown',
    visibility: {
      private: 'private',
      public: 'public',
    },
    rating: {
      label: (avgText, countText) => `⭐ ${avgText} · ${countText} ratings`,
      zero: '⭐ 0 · 0 ratings',
      rateTitle: (n) => `Rate ${n}`,
      loginToRate: 'Login to rate',
    },
    leaderboard: {
      title: 'Leaderboard',
      myBestPrefix: 'Your best:',
      empty: 'No scores yet — be the first to play!',
    },
    questions: {
      none: 'No questions yet.',
      qPrefix: 'Q',
    },
  },

  PLAY_SESSION: {
    locked: {
      title: 'Login to play',
      subtitle: 'You need an account to play sessions and save progress.',
    },
    header: {
      question: 'Question',
      questionProgress: (a, b) => `Question ${a} / ${b}`,
      questionOf: (a, b) => `Question ${a} of ${b}`,
      timeLeft: (s) => `⏱ ${s}s left`,
      timeLimit: (s) => `⏱ ${s}s`,
      prizeLabel: 'Prize',
      scoreLabel: 'Score',
    },
    aria: {
      progressDots: 'Progress dots',
      progressBar: 'Progress bar',
      mood: 'Mood',
    },
    done: {
      title: 'Nice run! 🎉',
      finalPrize: (moneyText) => `Final prize: ${moneyText}`,
      finalScore: (score) => `Final score: ${score}`,
    },
    states: {
      loading: 'Loading…',
      noQuestion: 'No question',
    },
    millionaire: {
      exit: 'Exit',
      lifelines: 'Lifelines',
      audienceLabel: 'Audience',
      prizeLadder: 'Prize Ladder',
      lifelineFifty: '50:50',
      lifelineFiftyShort: '50/50',
      lifelinePhone: 'Phone',
      lifelineAudience: 'Audience',
      audiencePollLabel: 'Audience poll',
    },
    results: {
      correct: 'Correct!',
      wrong: 'Wrong!',
      skipped: 'Skipped ➡',
      correctShort: 'Correct ✅',
      wrongShort: 'Wrong ❌',
      bonusSpeed: (bonus) => `+${bonus} speed`,
      next: 'Next →',
      finish: 'Finish 🏁',
    },
    actions: {
      reloadTitle: 'Reload current question',
    },
    story: {
      correctCount: (n) => `🏅 ${n} Correct!`,
    },
  },

  STORY: {
    badge: {
      text: 'Story Mode',
    },
    titlePrefix: 'Your',
    titleAccent: 'adventure',
    titleSuffix: 'starts here',
    subtitle:
      'Beat levels, earn stars, and unlock the next chapter. Fast taps, smart brain.',
    progress: {
      loggedOut: 'Login to play',
      loggedIn: (completed, total) => `🏁 ${completed}/${total} completed`,
    },
    starsSaved: (n) => `⭐ ${n} stars`,
    level: {
      label: 'LEVEL',
      titleFallback: (n) => `Level ${n}`,
      done: 'Done',
      play: 'Play',
      locked: 'Locked',
    },
    tooltips: {
      loginToPlay: 'Login to play',
      play: 'Play',
      locked: 'Locked',
    },
    difficulty: {
      easy: 'easy',
      medium: 'medium',
      hard: 'hard',
      unknown: 'unknown',
    },
    empty: 'No levels yet.',
    errors: {
      failedStart: 'Failed to start session',
    },
  },

  ADMIN_PAGE: {
    loginRequired: {
      title: 'Admin login required',
      subtitle: 'Login with the admin email to access the dashboard.',
    },
    notConfigured: {
      title: 'Admin is not configured',
      prefix: 'Set',
      middle: 'in the client and',
      suffix: 'in the API.',
    },
    forbidden: {
      title: 'Forbidden',
      subtitle: 'Your account is not in the admin allowlist.',
    },
    env: {
      client: 'VITE_ADMIN_EMAILS',
      api: 'ADMIN_EMAILS',
    },
  },

  CREATE_QUIZ: {
    defaults: {
      title: 'My Trivia Quiz ✨',
      description: 'A fun quiz made on TriviaVerse!',
      visibility: 'private',
    },
    hero: {
      badgeText: 'Build a quiz in minutes',
      titlePrefix: 'Create Your',
      titleAccent: 'Quiz',
      subtitle:
        'Add questions, set correct answers, then publish and share with friends.',
    },
    locked: {
      title: 'Login to create quizzes',
      subtitle: 'You need an account to save drafts and publish your quiz.',
    },
    errorTitle: 'Oops',
    panels: {
      create: '1) Create quiz',
      myQuizzes: '2) My quizzes',
      addQuestions: '3) Add questions',
      settings: 'Quiz settings',
    },
    labels: {
      title: 'Title',
      description: 'Description',
      visibility: 'Visibility',
      search: 'Search',
      questionText: 'Question text',
      timeSec: 'Time (sec)',
      points: 'Points',
    },
    placeholders: {
      quizTitleSearch: 'Type a quiz title...',
      quizId: 'Quiz ID (UUID)',
      accessUsername: 'Username (e.g. coolplayer123)',
      optionText: 'Option text',
    },
    help: {
      myQuizzesHint: "Open any quiz you’ve created (by name, not UUID).",
      privateAccessHint: 'Add usernames that can view this private quiz.',
    },
    empty: {
      noQuizzes: 'No quizzes yet — create your first draft on the left ✨',
      loadingOptions: 'Loading…',
      optionsNeedTwo: 'Add at least 2 options and mark 1 as correct.',
    },
    buttons: {
      backHome: 'Back Home',
      createDraft: 'Create draft ✨',
      open: 'Open',
      close: 'Close ✕',
      deleteQuiz: 'Delete 🗑',
      deleteQuizTitle: 'Delete quiz',
      deleteQuizForeverConfirm: 'Delete this quiz forever? This cannot be undone.',
      publish: 'Publish',
      publishRocket: 'Publish 🚀',
      publishDisabledTitle:
        'Add 2+ options and set exactly 1 correct per question',
      refresh: 'Refresh ↻',
      saveChanges: 'Save changes 💾',
      add: 'Add',
      addPlus: 'Add ➕',
      markCorrectTitle: 'Mark as correct',
      deleteThisQuizTitle: 'Delete this quiz',
    },
    publish: {
      fixBefore: (issues) => `Fix your quiz before publishing:\n- ${issues.join('\n- ')}`,
    },
    validation: {
      questionNeedsOptions: (orderIndex) =>
        `Question ${orderIndex} needs at least 2 options.`,
      questionNeedsCorrect: (orderIndex, correctCount) =>
        `Question ${orderIndex} must have exactly 1 correct option (currently ${correctCount}).`,
    },
  },

  ADMIN: {
    dashboard: {
      badge: 'Admin',
      title: 'Dashboard',
      subtitle: 'Pick a flow. Finish one thing at a time.',
    },
    flows: {
      questions: {
        title: 'Create Questions',
        desc: 'Add global questions fast (optional advanced).',
      },
      modes: {
        title: 'Build Game Modes',
        desc: 'Assign questions to Classic / Blitz / Millionaire.',
      },
      story: {
        title: 'Build Story Mode',
        desc: 'Create levels, fill pools, edit quickly.',
      },
    },
    modeCards: {
      classic: { title: 'Classic', desc: 'Balanced gameplay.' },
      blitz: { title: 'Blitz', desc: 'Fast 60s sprint.' },
      millionaire: { title: 'Millionaire', desc: '15-question ladder.' },
    },
    pills: {
      classic: 'Classic:',
      blitz: 'Blitz:',
      millionaire: 'Millionaire:',
      selected: 'Selected:',
      max: 'Max:',
      offset: 'Offset:',
      pool: 'Pool:',
      showing: 'Showing:',
      showingBare: 'Showing',
      categories: 'Categories:',
      addsOnly: 'Adds only (no replace)',
      diff: 'Diff',
      xp: 'XP',
      difficultyPrefix: 'D',
    },
    sections: {
      createStoryLevel: 'Create story level',
      levels: 'Levels',
      seedLevelsHint: 'Seed a level with random global questions.',
      noLevelsFound: 'No levels found.',
      noQuestionsYet: 'No questions yet.',
      noCategoriesFound: 'No categories found. Create one above.',
      addExistingToLevel: 'Add existing questions to a level',
      selectLevel: 'Select level...',
      currentLevelPool: 'Current level pool',
      createGlobalQuestion: 'Create global question',
      quickFlow: 'Quick flow',
      addExistingToMode: 'Add existing questions to a mode',
      poolSizes: 'Pool sizes',
      currentPool: 'Current pool',
      globalQuestionBank: 'Global Question Bank',
      globalBankSubtitle:
        'Browse all global questions, then assign them to a story level.',
      selectStoryLevel: 'Select story level...',
      searchOptional: 'Search (optional)...',
      noResults: 'No results.',
      levelsOverview: 'Levels overview',
      onlyTitleRequired: 'Only title is required.',
      dangerZone: 'Danger zone',
      classicCategoriesTitle: 'Classic categories',
      classicCategoriesSubtitle:
        'Create categories for Classic mode, then assign global questions to each category.',
    },
    text: {
      onlyTitleAdvancedOptional:
        'Only title is required. Advanced settings are optional.',
      thisCategoryFallback: 'this category',
      showAdvancedSettings: 'Show advanced settings',
      createLevel: 'Create level',
      seedRandom: 'Seed random',
      addExistingQuestionsSubtitle:
        'Search global questions, select, then add to a story level.',
      searchQuestionsPlaceholder: 'Search questions (blank = browse all)...',
      levelTitlePlaceholder: 'The Ancient Library',
      pickerSearchOptionalPlaceholder: 'Search (optional)...',
      classicCategoryNamePlaceholder: 'Category name (e.g. Geography)',
      classicCategoryIconPlaceholder: 'Icon (optional)',
      createGlobalQuestionSubtitle:
        'Pick the correct option (radio), choose modes, then create.',
      questionPlaceholder: 'What is the capital of France?',
      explanationPlaceholder: 'Optional...',
      createQuestionButton: 'Create question',
      modePoolsSubtitle:
        'Search global questions, select, then add to Classic / Blitz / Millionaire.',
      poolSizesHint: 'These counts are used when starting sessions.',
      currentModePoolSubtitle: 'View / remove questions currently assigned to this mode.',
      currentLevelPoolSubtitle: 'View / remove questions currently assigned to the selected level.',
      refreshPoolToLoad: 'Click “Refresh pool” to load questions.',
      selectLevelThenRefreshPool: 'Select a level, then click “Refresh pool”.',
      poolEmpty: 'Pool: -',
      questionsSuffix: 'questions',
      addsRandomGlobalQuestionsToModePool: 'Adds random global questions to this mode pool',
      addsRandomGlobalQuestionsToLevel: 'Adds random global questions to this level',
      levelsOverviewHint: 'Each level should have 10 questions. Click “Edit” to fill it.',
    },
    labels: {
      title: 'Title',
      difficultyMin: 'Difficulty min',
      difficultyMax: 'Difficulty max',
      passScoreMin: 'Pass score min',
      xpReward: 'XP reward',
      question: 'Question',
      difficultyRating: 'Difficulty (1-10)',
      explanation: 'Explanation',
      timeLimitSec: 'Time limit (sec)',
      points: 'Points',
    },
    actions: {
      search: 'Search',
      selectAll: 'Select all',
      selectAllPage: 'Select all (page)',
      selectPage: 'Select page',
      clearSelected: 'Clear selected',
      clear: 'Clear',
      prev: 'Prev',
      next: 'Next',
      addOption: '+ Add option',
      edit: 'Edit',
      refreshPool: 'Refresh pool',
      refreshList: 'Refresh list',
      viewPool: 'View pool',
      addQuestions: 'Add questions',
      categories: 'Categories',
      autoFillRandom: 'Auto-fill random',
      autoFill: 'Auto-fill',
      clearPool: 'Clear pool',
      remove: 'Remove',
      deleteQuestion: 'Delete question',
      deleteLevel: 'Delete level',
      create: 'Create',
      deleteCategory: 'Delete category',
      customQuizBuilder: 'Custom Quiz Builder',
      addSelected: 'Add selected',
      replacePoolWithSelected: 'Replace pool with selected',
      addSelectedToLevel: 'Add selected to level',
      replaceLevelPool: 'Replace level pool',
      addSelectedToMode: 'Add selected to mode',
      replacePool: 'Replace pool',
    },
    hints: {
      globalBankEmpty: 'Click “Search” to load global questions.',
      searchToSeeResultsEmpty: 'Search to see results here.',
      replaceLevelPoolTitle: 'Replace the entire level pool with your selection',
      replacePoolTitle: 'Replace the entire pool with your selected questions',
      removeOptionTitle: 'Remove option',
      clearModePoolTitle: 'Remove all questions from this mode pool',
      clearLevelPoolTitle: 'Remove all questions from this level pool',
      seedModePoolTitle: 'Adds random global questions to this mode pool',
      seedLevelPoolTitle: 'Adds random global questions to this level',
      deleteCategoryTitle: 'Delete this category',
      seedClassicCategoryTitle:
        'Auto-fill from Classic pool if available, otherwise random global questions',
    },
    aria: {
      difficultyRating: 'Difficulty rating',
    },
    placeholders: {
      newOption: 'New option',
      optionA: 'Option A',
      optionB: 'Option B',
      optionC: 'Option C',
      optionD: 'Option D',
    },
    modals: {
      addQuestionsTitle: 'Add questions',
      addGlobalQuestionsTitle: (targetTitle) => `Add global questions → ${targetTitle}`,
      classicCategoriesTitle: 'Classic categories',
    },
    format: {
      modePoolTitle: (modeTitle) => `${modeTitle} Pool`,
      levelPoolTitle: (levelNumber) => `Level #${levelNumber} Pool`,
      classicCategoryPoolTitle: (categoryName) => `Classic: ${categoryName}`,
      levelListTitle: (levelNumber, title) => `#${levelNumber} — ${title}`,
      questionsCount: (filled, total) => `${filled}/${total} questions`,
      levelBadgeTitle: (levelNumber, title) => `Level #${levelNumber}: ${title}`,
    },
    confirm: {
      clearModePool: (modeTitle) =>
        `Clear the entire ${modeTitle} pool? This cannot be undone.`,
      clearPoolGeneric: 'Clear this pool? This cannot be undone.',
      deleteGlobalQuestion:
        'Delete this global question?\n\nThis removes it from all pools and cannot be undone.',
      deleteStoryLevel: (levelNumber, title) =>
        `Delete Level #${levelNumber}: \"${title}\"?\n\nThis removes the level pool and player progress for that level. This cannot be undone.`,
      deleteClassicCategory: (name) =>
        `Delete \"${name}\"?\n\nThis also removes all Classic pool assignments for this category.`,
    },
    toasts: {
      createdLevel: (levelNumber, title) => `Created level #${levelNumber}: ${title}`,
      createdQuestion: (questionId) => `Created question ${questionId}`,
      questionDeleted: 'Question deleted.',
      levelDeleted: 'Level deleted.',
      categoryCreated: 'Category created.',
      categoryDeleted: 'Category deleted.',
      autoFilledCategory: (addedCount) => `Auto-filled category (+${addedCount || 0}).`,
      poolCleared: 'Pool cleared.',
      poolReplaced: 'Pool replaced.',
      questionsAdded: 'Questions added.',
      autoFilledMode: (modeTitle, addedCount) =>
        `Auto-filled ${modeTitle} (+${addedCount || 0}).`,
      autoFilledLevel: (addedCount) => `Auto-filled level (+${addedCount || 0}).`,
      modePoolCleared: (modeTitle) => `${modeTitle} pool cleared.`,
    },
    modeOptions: {
      classic: 'classic',
      blitz: 'blitz',
      millionaire: 'millionaire',
    },
    poolSizeLabels: {
      classic: 'Classic',
      blitz: 'Blitz',
      millionaire: 'Millionaire',
    },
    quickFlowSteps: {
      create: 'Create questions here.',
      modes: 'Assign them to mode pools in "Mode Pools".',
      story: 'Assign them to story levels in "Story".',
    },
  },
};
