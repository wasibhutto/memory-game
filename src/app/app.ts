ngOnInit() {
  const url = 'https://memory-game-29374-default-rtdb.firebaseio.com/visitors.json';
  fetch(url)
    .then(res => res.json())
    .then(count => {
      const newCount = (count || 0) + 1;
      this.visitorCount.set(newCount);
      fetch(url, {
        method: 'PUT',
        body: JSON.stringify(newCount)
      });
    });
}

trackGamePlayed() {
  const url = 'https://memory-game-29374-default-rtdb.firebaseio.com/gamesPlayed.json';
  fetch(url)
    .then(res => res.json())
    .then(count => {
      const newCount = (count || 0) + 1;
      this.gamesPlayed.set(newCount);
      fetch(url, {
        method: 'PUT',
        body: JSON.stringify(newCount)
      });
    });
}