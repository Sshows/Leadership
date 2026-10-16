import fs from 'node:fs';
const b=JSON.parse(fs.readFileSync('bank.json','utf8')),q=JSON.parse(fs.readFileSync('quiz.json','utf8'));
if(b.length!==60||q.length!==60)throw Error('Expected 60 tickets and questions');
for(let i=0;i<60;i++){
 const id=`Q${String(i+1).padStart(2,'0')}`;
 if(b[i].id!==id||q[i].id!==id||!['english','simple','example','answer','memory'].every(k=>b[i][k]))throw Error(`Incomplete ${id}`);
 if(q[i].options.length!==4||new Set(q[i].options.map(o=>o.id)).size!==4||new Set(q[i].options.map(o=>o.text)).size!==4||!q[i].options.find(o=>o.id===q[i].correctOptionId))throw Error(`Invalid quiz ${id}`);
}
console.log('Verified 60 complete source tickets and 60 four-option quizzes. Static site is ready.');
