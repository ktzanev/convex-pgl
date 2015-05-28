function MainCtrl($scope, $timeout) {

  $scope.generateRandomPts = function() {
    var pts = [];
    for (var i = 0; i < $scope.numPts ; i++)
      pts.push({x : new BigNumber((Math.random()*4-2).toFixed(2)), y : new BigNumber((Math.random()*4-2).toFixed(2))});

    $scope.setPts(pts);
    $scope.ptsToStr($scope.initialPath);
  };

  $scope.setToRegularPolygon = function() {
    var pts = [];
    var r = Math.sqrt(2);
    for (var i = 0; i < $scope.numPts ; i++) {
      var x = (new BigNumber(Math.round(1000*r*Math.cos(2*i*Math.PI/$scope.numPts)))).div(1000);
      var y = (new BigNumber(Math.round(1000*r*Math.sin(2*i*Math.PI/$scope.numPts)))).div(1000);
      var pt = {x : x, y : y};
      pts.push(pt);
    }

    $scope.setPts(pts);
    $scope.ptsToStr($scope.initialPath);
  };

  $scope.strToPts = function() {
    var coords = $scope.strPts.replace(/^[^0-9.-]+|[^0-9.-]+$/g, '').split(/[^0-9.-]+/);
    var pts = [];
    for(var i=0; i+1 < coords.length; i+=2)
      pts.push({x : new BigNumber(coords[i]), y : new BigNumber(coords[i+1])});

    $scope.setPts(pts);
  };

  $scope.doSym = function() {
    $scope.setPts($scope.mainPath.concat($scope.mainPath.map(reverse)));
    $scope.ptsToStr($scope.mainPath);
  }

  $scope.setPts = function(pts) {
    // the non translated path
    $scope.initialPath = ConvexHull(pts);
    $scope.initialBarycentre = barycentrePath($scope.initialPath);

    // the main (translated) path
    $scope.mainPath = translatePath($scope.initialPath,$scope.initialBarycentre);
    $scope.mainBarycentre = barycentrePath($scope.mainPath);

    // the dual path
    $scope.dualPath = dualPath($scope.mainPath);
    $scope.dualBarycentre = barycentrePath($scope.dualPath);

    // the volume product
    $scope.volProd = $scope.mainBarycentre.s.times($scope.dualBarycentre.s);

    // calculate the grid
    $scope.calcGrid();

  };

  $scope.ptsToStr = function(pts) {
    $scope.strPts = pathToString(pts);
  };

  $scope.svgPath = function(p) {
    try {
      return "M "+p.map(function(g) {return g.x.toFixed(2)+" "+g.y.toFixed(2);}).join(" L ")+ " Z";
    }
    catch(e) {
      return "M0 0"; // because "" generate error in webkit (a bug)
    }
  };

  $scope.svgLine = function(v) {
    if ( v == null)
      return "M0 0"; // because "" generate error in webkit (a bug)
    var one = new BigNumber(1);
    if (!v.x.eq(0)) {
      var xp = one.minus(v.y.times(2.5)).div(v.x);
      var xm = one.minus(v.y.times(-2.5)).div(v.x);
      return "M "+xm.toFixed(2)+" -2.5 L "+xp.toFixed(2)+" 2.5";
    }
    else if (!v.y.eq(0)) {
      var yp = one.minus(v.x.times(2.5)).div(v.y);
      var ym = one.minus(v.x.times(-2.5)).div(v.y);
      return "M -2.5 "+ym.toFixed(2)+" L 2.5 "+yp.toFixed(2);
    }
    else {
      return "M0 0"; // because "" generate error in webkit (a bug)
    }
  };

  $scope.svgConjLine = function(b) {
    if (b == null)
      return "M0 0"; // because "" generate error in webkit (a bug)
    var norm = b.x.times(b.x).plus(b.y.times(b.y)).sqrt();
    if (norm.eq(0))
      return "M0 0"; // because "" generate error in webkit (a bug)
    else {
      nx = b.x.div(norm);
      ny = b.y.div(norm);
      return "M "+ny.toFixed(4)+" "+nx.neg().toFixed(4)+" L "+ny.neg().toFixed(4)+" "+nx.toFixed(4);
    }
  }

  $scope.numToColor = function (n) {
    if ( n.abs().lt(1e-7))
      return 'rgb(0,0,0)';
    else if ( n.gt(0))
      return 'rgb(0,0,'+n.times(200).plus(55).toFixed(0)+')';
    else
      return 'rgb('+n.times(-200).plus(55).toFixed(0)+',0,0)';
  }

  $scope.calcGrid = function() {
    var d = new BigNumber('2');
    var n = 40;
    $scope.grid = []
    for(var i=0; i <= n; i+=1) {
      a = d.times((-1/2+i/n).toFixed(4));
      for(var j=0; j <= n; j+=1) {
        b = d.times((-1/2+j/n).toFixed(4));
        // calculate the transformed path
        var v = {x:a, y:b};
        if (isOutside($scope.mainPath, v))
          continue;
        $scope.transfPath = projTransformPath($scope.mainPath, v);
        $scope.transfBarycentre = barycentrePath($scope.transfPath);
        $scope.transfPath = translatePath($scope.transfPath,$scope.transfBarycentre);
        // the dual of transformed path
        $scope.dualTransfPath = dualPath($scope.transfPath);
        $scope.dualTransfBarycentre = barycentrePath($scope.dualTransfPath);
        // set the grid value
        $scope.grid.push({
          x : a.toFixed(2),
          y : b.toFixed(2),
          col : $scope.numToColor($scope.transfBarycentre.s.times($scope.dualTransfBarycentre.s).minus($scope.volProd))
        });
      }
    }
  };

  $scope.overGrid = function(a,b,col) {
    // set colors
    $scope.over.col = col;

    // calculate transformed path
    $scope.over.v = {x:new BigNumber(a), y:new BigNumber(b)};
    $scope.over.mainPath = projTransformPath($scope.mainPath, $scope.over.v);
    $scope.over.mainBarycentre = barycentrePath($scope.over.mainPath);
    $scope.over.mainPath = translatePath($scope.over.mainPath,$scope.over.mainBarycentre);
    switch ($scope.rescale) {
      case "fit-area" :
        $scope.over.mainPath = scaleToFitArea($scope.over.mainPath,2);
        $scope.over.mainBarycentre = barycentrePath($scope.over.mainPath);
        // $scope.over.mainPath = translatePath($scope.over.mainPath,$scope.over.mainBarycentre);
        break;

      case "keep-volume" :
        $scope.over.mainPath = scaleToKeepVolume($scope.over.mainPath,$scope.mainBarycentre.s.div($scope.over.mainBarycentre.s).sqrt());
        $scope.over.mainBarycentre = barycentrePath($scope.over.mainPath);
        // $scope.over.mainPath = translatePath($scope.over.mainPath,$scope.over.mainBarycentre);
    }
    // the dual of transformed path
    $scope.over.dualPath = dualPath($scope.over.mainPath);
    $scope.over.dualBarycentre = barycentrePath($scope.over.dualPath);

    $scope.over.volProd = $scope.over.mainBarycentre.s.times($scope.over.dualBarycentre.s);
    $scope.over.diff = $scope.over.volProd.minus($scope.volProd);
  }

  $scope.outGrid = function() {
    $scope.over = {};
  }

  $scope.startCalc = function(f) {
    $scope.inCalc=true;
    $timeout(f).then($scope.stopCalc);
  }

  $scope.stopCalc = function() {
    $scope.inCalc=false;
  }

  // initial setup
  $scope.numPts = 7;
  $scope.generateRandomPts();
}
