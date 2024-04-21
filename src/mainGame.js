import { Application, Assets, Container, Graphics, Sprite } from "pixi.js";

const app = new Application();
const appWidth = 1000;
const appheight = 1000;
const tileDimensions = 10;
const entityGrid = [];
const neighborCheckGrid = [];
const entityGridWidth = appWidth/tileDimensions;
const entityGridHeight = appheight/tileDimensions;
const liveEntityList =[];

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
        {alias: "window_left_red", src: new URL("./assets/tile_0082.png", import.meta.url).href},
        {alias: "window_center_red", src: new URL("./assets/tile_0083.png", import.meta.url).href},
        {alias: "window_right_red", src: new URL("./assets/tile_0084.png", import.meta.url).href},
        {alias: "detector_bg", src: new URL("./assets/conTile.png", import.meta.url).href},

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

    const clickDetector = Sprite.from('detector_bg');
    clickDetector.width = appWidth;
    clickDetector.height = appheight;
    clickDetector.interactive = true;
    clickDetector.eventMode = 'static';
    clickDetector.cursor = 'crosshair';
    clickDetector.alpha = 0.01;
    clickDetector.on('pointerdown', detector_clicked);
    app.stage.addChild(clickDetector);

    console.log(entityGrid);

    function drawEntityGrid()
    {
        //first lets clear em
        tileGraphics.rect(0,0,appWidth, appheight);
        tileGraphics.fill(0x000000);

        //now lets go down the list
        for(let yctr = 0; yctr < entityGridHeight; yctr++)
        {
            for(let xctr = 0; xctr < entityGridWidth; xctr++)
            {
                if(entityGrid[yctr][xctr])
                {
                    tileGraphics.rect(xctr*tileDimensions,yctr*tileDimensions,tileDimensions, tileDimensions);
                    tileGraphics.fill(0x999900);
                }
            }        
        }
    }

    function directEditEntityGrid(gx, gy)
    {
        let lifeStatus = entityGrid[gy][gx];
        entityGrid[gy][gx] = !lifeStatus;

        if(!lifeStatus)
        {
            
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


        console.log(positions.adjustedX);
        console.log(positions.adjustedY);

        directEditEntityGrid(positions.adjustedX, position.adjustedY);
        drawEntityGrid();

    }

}