const fs = require('fs');
let content = fs.readFileSync('c:/Users/pc/Desktop/Antigravity/palabras/frontend/src/main.js', 'utf8');

content = content.replace(
  'State.appAnswers[questionId] = value;',
  'State.appAnswers[questionId] = value; State.appAnswersLabels = State.appAnswersLabels || {}; if (el) State.appAnswersLabels[questionId] = el.innerText.trim();'
);

content = content.replace(
  'State.appAnswers[\'otros\'] = input.value.trim();',
  'State.appAnswers[\'otros\'] = input.value.trim(); State.appAnswersLabels = State.appAnswersLabels || {}; State.appAnswersLabels[questionId] = \'Otros: \' + input.value.trim();'
);

content = content.replace(
  'respuestas_elegibilidad: { ...State.appAnswers }',
  'respuestas_elegibilidad: { ...(State.appAnswersLabels || State.appAnswers) }'
);

content = content.replace(
  'State.appAnswers = {};',
  'State.appAnswers = {}; State.appAnswersLabels = {};'
);

fs.writeFileSync('c:/Users/pc/Desktop/Antigravity/palabras/frontend/src/main.js', content);
