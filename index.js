const randomInt = (min, max) => {
  let randInt = min - 0.5 + Math.random() * (max - min + 1);
  return Math.round(randInt);
}

const angle = (b, a) => {
  return Math.atan((a.y - b.y) / (a.x - b.x));
}

const hullCross = (point) => {
  const a = hull[hull.length - 2];
  const b = hull[hull.length - 1];
  const c = point
  return (b.x - a.x) * (c.y - b.y) - (b.y - a.y) * (c.x - b.x);
}

let points = [];
let chart;
let hull = [];
let leftMost;

const findMBR = () => {
  let hullPoints = []
  for (let i = 0; i < hull.length; i++) {
    hullPoints.push([hull[i].x, hull[i].y]);
  }

  const edges = [];
  for (let i = 0; i < hullPoints.length - 1; i++) {
    edges.push([
      hullPoints[i + 1][0] - hullPoints[i][0],
      hullPoints[i + 1][1] - hullPoints[i][1]
    ]);
  }

  const angles = [...new Set(
    edges.map(edge =>
      Math.abs(
        Math.atan2(edge[1], edge[0]) % (Math.PI / 2)
      )
    )
  )];

  const rotations = angles.map(angle => {
    return [
      [Math.cos(angle), Math.cos(angle - Math.PI / 2)],
      [Math.cos(angle + Math.PI / 2), Math.cos(angle)]
    ]
  });

  const rotationPoints = rotations.map(rotation =>
    math.multiply(
      math.matrix(rotation),
      math.transpose(math.matrix(hullPoints))
    ).toArray()
  );

  const minXY = rotationPoints.map(curPoint => {
    const minValues = math.min(curPoint, 1);
    return [minValues[0], minValues[1]];
  });
  const maxXY = rotationPoints.map(curPoint => {
    const maxValues = math.max(curPoint, 1);
    return [maxValues[0], maxValues[1]];
  });

  const minX = minXY.map(m => m[0]);
  const minY = minXY.map(m => m[1]);
  const maxX = maxXY.map(m => m[0]);
  const maxY = maxXY.map(m => m[1]);

  const areas = minX.map((_, i) =>
    (maxX[i] - minX[i]) * (maxY[i] - minY[i])
  );
  const bestI = areas.reduce(
    (iMax, x, i, arr) => x < arr[iMax] ? i : iMax,
    0
  );

  const x1 = maxX[bestI];
  const x2 = minX[bestI];
  const y1 = maxY[bestI];
  const y2 = minY[bestI];
  const r = rotations[bestI];

  const minRect = [];
  minRect.push(math.multiply([x1, y2], r));
  minRect.push(math.multiply([x2, y2], r));
  minRect.push(math.multiply([x2, y1], r));
  minRect.push(math.multiply([x1, y1], r));
  minRect.push(math.multiply([x1, y2], r));

  return minRect;
}

const generateRandomPoints = (n, width, height) => {
  points = [];
  const indent = 15;
  for (let i = 0; i < n; i++) {
    const point = {
      x: randomInt(indent, width - indent),
      y: randomInt(indent, height - indent)
    }
    points.push(point);
  }
}

const solve = (firstTime) => {
  hull = []

  if (!points.length || points.length < 2) {
    generateRandomPoints(50, 500, 250);
  }

  for (let i = 0; i < points.length; i++) {
    leftMost = leftMost && leftMost.x < points[i].x ? leftMost : points[i]
  }

  points = points.filter(p => JSON.stringify(p) !== JSON.stringify(leftMost))
  points.sort((a, b) => angle(leftMost, a) - angle(leftMost, b));
  points = [leftMost, ...points];

  hull.push(points[0]);
  hull.push(points[1]);

  for (let i = 2; i < points.length; i++) {
    while (points[i] && hull.length > 1 && hullCross(points[i]) <= 0) {
      hull.pop();
    }
    hull.push(points[i]);
  }
  hull.push(hull[0]);

  const mbr = findMBR();
  const mbrPoints = [
    { x: mbr[0][0], y: mbr[0][1] },
    { x: mbr[1][0], y: mbr[1][1] },
    { x: mbr[2][0], y: mbr[2][1] },
    { x: mbr[3][0], y: mbr[3][1] },
    { x: mbr[0][0], y: mbr[0][1] }
  ];

  const data = {
    datasets: [{
      label: 'Points set',
      data: points,
      backgroundColor: '#12314D',
      radius: 3
    },
    {
      label: 'Convex hull',
      data: hull,
      backgroundColor: '#6DF043',
      borderColor: '#6DF043',
      radius: 5,
      showLine: true
    },
    {
      label: 'Minimum bounding rectangle',
      data: mbrPoints,
      borderColor: '#50A6F0',
      backgroundColor: '#50A6F0',
      borderWidth: 5,
      radius: 8,
      showLine: true,
    }]
  }

  const chartConfig = {
    type: 'scatter',
    data
  };

  if (firstTime) {
    chart = new Chart(document.getElementById('myChart'), chartConfig)
  }
  else {
    chart.data = chartConfig.data;
    chart.update();
  }
}

solve(true);

const checkInput = inputArr => {
  if (!inputArr.length || inputArr.length % 2 != 0 || inputArr.length < 4) {
    return false;
  }

  for (let i = 0; i < inputArr.length; i++) {
    if (Number.isNaN(parseFloat(inputArr[i]))) {
      return false;
    }
  }

  return true;
}

const inputButton = document
  .getElementById('inputButton')
  .addEventListener('click', () => {
    const text = document.getElementById('text').value.trim();
    const arr = text.split(/\s+/)
    
    if (checkInput(arr)) {
      points = [];
      for (let i = 0; i < arr.length; i += 2) {
        points.push({
          x: parseFloat(arr[i]),
          y: parseFloat(arr[i + 1])
        });
      }
      solve();
    }
  })

const smallSampleButton = document
  .getElementById('smallSampleButton')
  .addEventListener('click', () => {
    generateRandomPoints(50, 500, 250);
    solve();
  })

const bigSampleButton = document
  .getElementById('bigSampleButton')
  .addEventListener('click', () => {
    generateRandomPoints(10000, 2000, 1000);
    solve();
  })