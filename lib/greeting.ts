export function getTimeGreeting(name: string = "there") {
  const hour = new Date().getHours();
  let greeting = "";

  if (hour >= 5 && hour < 12) greeting = `Good Morning, ${name} ☀️`;
  else if (hour >= 12 && hour < 14) greeting = `Good Noon, ${name} 🌞`;
  else if (hour >= 14 && hour < 17) greeting = `Good Afternoon, ${name}`;
  else if (hour >= 17 && hour < 21) greeting = `Good Evening, ${name}`;
  else if (hour >= 21 && hour < 24) greeting = `Good Night, ${name} 🌙`;
  else if (hour >= 0 && hour < 3) greeting = `Late Night Owl, ${name} 🦉`;
  else greeting = `Hi, ${name} 👋`;

  return greeting;
}
// -
