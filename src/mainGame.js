import { Application, Assets, Container, Graphics, Sprite } from "pixi.js";

const app = new Application();
const appWidth = 1000;
const appheight = 1000;
const tileDimensions = 10;
const entityGrid = [];
const neighborCheckGrid = [];
const entityGridWidth = appWidth/tileDimensions;
const entityGridHeight = appheight/tileDimensions;
let gridUpdating = false;
let buildMode = true;
let buildKeyDown = false; //the key Z
let stepKeyDown = false; //the key x

const premadeSet = [
{ x: 37, y: 31 },
{ x: 38, y: 31 },
{ x: 41, y: 31 },
{ x: 42, y: 31 },
{ x: 35, y: 36 },
{ x: 36, y: 36 },
{ x: 36, y: 37 },
{ x: 37, y: 37 },
{ x: 37, y: 38 },
{ x: 38, y: 38 },
{ x: 39, y: 38 },
{ x: 40, y: 38 },
{ x: 40, y: 37 },
{ x: 41, y: 37 },
{ x: 41, y: 38 },
{ x: 42, y: 38 },
{ x: 43, y: 37 },
{ x: 44, y: 36 },
{ x: 45, y: 36 },
{ x: 35, y: 28 },
{ x: 36, y: 29 },
{ x: 37, y: 28 },
{ x: 43, y: 29 },
{ x: 42, y: 28 },
{ x: 44, y: 28 },
{ x: 32, y: 34 },
{ x: 31, y: 33 },
{ x: 30, y: 34 },
{ x: 30, y: 35 },
{ x: 30, y: 36 },
{ x: 31, y: 37 },
{ x: 32, y: 36 },
{ x: 47, y: 34 },
{ x: 48, y: 33 },
{ x: 49, y: 34 },
{ x: 49, y: 35 },
{ x: 49, y: 36 },
{ x: 47, y: 37 },
{ x: 48, y: 37 },
{ x: 48, y: 38 },
{ x: 38, y: 34 },
{ x: 40, y: 34 },
{ x: 32, y: 44 },
{ x: 33, y: 44 },
{ x: 45, y: 44 },
{ x: 46, y: 44 },
{ x: 34, y: 43 },
{ x: 35, y: 42 },
{ x: 36, y: 42 },
{ x: 37, y: 42 },
{ x: 38, y: 42 }
];

(async ()=>{
    await setup();
    await load();
    await play();
})();

async function setup()
{
    await app.init({
        background: "#303030",
        width: appWidth,
        height: appheight,
    });
    document.body.appendChild(app.canvas);
}

async function load()
{
    const assets = [
        {alias: "instructions", src: new URL("./assets/instructions.png", import.meta.url).href},
        {alias: "detector_bg", src: new URL("./assets/conTile.png", import.meta.url).href},
        {alias: "targeter", src: new URL("./assets/targetingTile.png", import.meta.url).href},
    ];

    await Assets.load(assets);
}

async function play()
{
    //lets fill up the entity grid
    for(let yctr = 0; yctr < entityGridHeight; yctr++)
    {
        let entityRow = [];
        let neighborCheckRow = [];
        for(let xctr = 0; xctr < entityGridWidth; xctr++)
        {
            entityRow.push(false);
            neighborCheckRow.push(0);
        }
        entityGrid.push(entityRow);
        neighborCheckGrid.push(neighborCheckRow);
    }

    

    const entityBoard = new Container();
    app.stage.addChild(entityBoard);
    const tileGraphics = new Graphics();
    entityBoard.addChild(tileGraphics);

    const targeter = Sprite.from('targeter');
    app.stage.addChild(targeter);

    const instructions = Sprite.from('instructions');
    app.stage.addChild(instructions);


    const clickDetector = Sprite.from('detector_bg');
    clickDetector.width = appWidth;
    clickDetector.height = appheight;
    clickDetector.interactive = true;
    clickDetector.eventMode = 'static';
    // clickDetector.cursor = 'crosshair';
    clickDetector.alpha = 0.01;
    clickDetector.on('pointerdown', detector_clicked);
    app.stage.addChild(clickDetector);

    //load the presetlivetiles
    premadeSet.forEach((live)=>{
        directEditEntityGrid(live.x, live.y);
    });
    drawEntityGrid();

    let lastMousePosition = {x:0,y:0}
    clickDetector.on('mousemove', (event)=>{
    
       lastMousePosition.x = event.global.x;
       lastMousePosition.y = event.global.y;
       if(lastMousePosition.x>appWidth/2)
       {
        instructions.x = 0;
       }else
       {
        instructions.x = appWidth-instructions.width;
       }
       if(targeter)
       {
        targeter.x = Math.floor(lastMousePosition.x/tileDimensions)*tileDimensions;
        targeter.y = Math.floor(lastMousePosition.y/tileDimensions)*tileDimensions;
       } 
    });

    app.ticker.add((time)=>{gameLoop(time);})

    let currentLogTime = 0;
    let loopActivateTime = 10;
    function gameLoop(time)
    {
        if(buildMode)
        {
            if(!targeter.visible) targeter.visible = true;
            if(!instructions.visible) instructions.visible = true;
            return;
        }
        if(targeter.visible) targeter.visible = false;
        if(instructions.visible) instructions.visible = false;
        currentLogTime+=time.deltaTime;
        if(currentLogTime>loopActivateTime)
        {
            worldStep();
            currentLogTime = 0;
        }
    }

    window.addEventListener("keydown",onKeyDown,false);
    window.addEventListener("keyup",onKeyUp,false);

    function onKeyDown(event)
    {
        if((event.key=="z" || event.key=="Z")&&!buildKeyDown)
        {
            //activate build mode
            buildKeyDown = true;

            buildMode = !buildMode;
        }
        
        if((event.key=="x" || event.key=="X")&&!stepKeyDown)
        {
            stepKeyDown = true;
           //call a step mode 
           worldStep();

        }
    }

    function onKeyUp(event)
    {
        if((event.key=="z" || event.key=="Z")&&buildKeyDown)
        {
            //activate build mode
            buildKeyDown = false;
        }
        
        if((event.key=="x" || event.key=="X")&&stepKeyDown)
        {
            stepKeyDown = false;
        }
    }

    function worldStep()
    {
        //calculate entity changes and change due to the conway ruleset
        gridUpdating = true;
        //first lets fill up the neighbor list
        updateNeighborList();

        //then lets update the entityGrid
        updateEntityGridAndClean();

        drawEntityGrid()

        gridUpdating = false;

        
    }

    function updateNeighborList()
    {
        //now lets go down the list
        for(let yctr = 0; yctr < entityGridHeight; yctr++)
        {
            for(let xctr = 0; xctr < entityGridWidth; xctr++)
            {
                if(neighborCheckGrid[yctr][xctr]>9)
                {
                    markNeighborTiles(xctr, yctr);
                }
            }        
        }
    }

    function updateEntityGridAndClean()
    {
        for(let yctr = 0; yctr < entityGridHeight; yctr++)
        {
            for(let xctr = 0; xctr < entityGridWidth; xctr++)
            {
                //turn off the light
                // entityGrid[yctr][xctr] = false;
                switch(neighborCheckGrid[yctr][xctr])
                {
                    case 3:
                    case 12:
                    case 13:
                        //lives
                        entityGrid[yctr][xctr] = true;
                        neighborCheckGrid[yctr][xctr] = 10;
                        break
                    default:
                        //dies
                        entityGrid[yctr][xctr] = false;
                        neighborCheckGrid[yctr][xctr] = 0;
                        break;
                }
                
            }        
        }
    }

    function markNeighborTiles(x,y)
    {
        let top_center = {x:x, y:y-1};
        let top_left = {x:x-1, y:y-1};
        let top_right = {x:x+1, y:y-1};

        let mid_left = {x:x-1, y:y};
        let mid_right = {x:x+1, y:y};

        let bot_center = {x:x, y:y+1};
        let bot_left = {x:x-1, y:y+1};
        let bot_right = {x:x+1, y:y+1};

        let checkCoords = [
            top_center,
            top_left,
            top_right,
            mid_left,
            mid_right,
            bot_center,
            bot_left,
            bot_right
        ];

        checkCoords.forEach((coords)=>{
            if(
            coords.x < 0 ||
            coords.x >= entityGridWidth ||
            coords.y < 0 ||
            coords.y >= entityGridHeight)
            {
                //out of bounds
                //toss an error?
                //console.log("out of bounds");
            }else{
                //add a point to the neighborgrid
                neighborCheckGrid[coords.y][coords.x] += 1;
                //console.log(neighborCheckGrid[coords.y][coords.x]);
            }
        })
    }

    function drawEntityGrid()
    {
        //first lets clear em
        tileGraphics.rect(0,0,appWidth, appheight);
        tileGraphics.fill(0x303030);

        //now lets go down the list
        for(let yctr = 0; yctr < entityGridHeight; yctr++)
        {
            for(let xctr = 0; xctr < entityGridWidth; xctr++)
            {
                if(entityGrid[yctr][xctr]==true)
                {
                    tileGraphics.rect(xctr*tileDimensions,yctr*tileDimensions,tileDimensions, tileDimensions);
                    tileGraphics.fill(0x999900);
                }
            }        
        }
    }

    function directEditEntityGrid(gx, gy)
    {
        if(!buildMode) return;
        entityGrid[gy][gx] = !entityGrid[gy][gx];

        if(entityGrid[gy][gx] == true)
        {
            neighborCheckGrid[gy][gx] = 10;
            
        }else if(entityGrid[gy][gx] == false)
        {
            neighborCheckGrid[gy][gx] = 0;    
        } 
    }

    function detector_clicked(event)
    {
        var positions = {
            x: event.global.x,
            y: event.global.y,
            adjustedX: Math.floor(event.global.x/tileDimensions),
            adjustedY: Math.floor(event.global.y/tileDimensions),
        }

        directEditEntityGrid(positions.adjustedX, positions.adjustedY);
        drawEntityGrid();
    }

}