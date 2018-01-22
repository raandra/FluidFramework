// tslint:disable

import * as MergeLib from "./index";
export enum OverlayNodePosition {
    Above,
    Left,
    Right,
    Append,
    Prepend,
    Root
}

let onodeTypeKey = "onodeType";

function createTreeMarkerOps(beginMarkerPos: MergeLib.IMarkerPosition, endMarkerPos: MergeLib.IMarkerPosition,
    id: string, nodeType: string, beginMarkerProps?: MergeLib.PropertySet) {
    let endMarkerProps = MergeLib.createMap<any>();
    endMarkerProps[MergeLib.reservedMarkerIdKey] = "end-" + id;
    endMarkerProps[MergeLib.reservedRangeLabelsKey] = ["onode"];
    if (!beginMarkerProps) {
        beginMarkerProps = MergeLib.createMap<any>();
    }
    beginMarkerProps[MergeLib.reservedMarkerIdKey] = id;
    beginMarkerProps[MergeLib.reservedRangeLabelsKey] = ["onode"];
    beginMarkerProps[onodeTypeKey] = nodeType;
    return [
        <MergeLib.IMergeTreeInsertMsg>{
            marker: { behaviors: MergeLib.MarkerBehaviors.RangeBegin },
            markerPos1: beginMarkerPos,
            props: beginMarkerProps,
            type: MergeLib.MergeTreeDeltaType.INSERT,
        },
        <MergeLib.IMergeTreeInsertMsg>{
            marker: { behaviors: MergeLib.MarkerBehaviors.RangeEnd },
            markerPos1: endMarkerPos,
            props: endMarkerProps,
            type: MergeLib.MergeTreeDeltaType.INSERT,
        }
    ]
}

let idSuffix = 0;
function makeId(client: MergeLib.Client) {
    return `${client.longClientId}Node${idSuffix++}`;
}

function endIdFromId(id: string) {
    return "end-"+id;
}

export function insertOverlayNode(client: MergeLib.Client, nodeType: string, 
    position: OverlayNodePosition, beginProps: MergeLib.PropertySet,
    refNodeId?: string) {
    let nodeId = makeId(client);
    switch (position) {
        case OverlayNodePosition.Append: {
            let endId = endIdFromId(refNodeId);
            let beforeRef = <MergeLib.IMarkerPosition>{ id: endId, before: true };
            let markerOps = createTreeMarkerOps(beforeRef, beforeRef,
                nodeId, nodeType, beginProps);
            let groupOp = <MergeLib.IMergeTreeGroupMsg>{
                ops: markerOps,
                type: MergeLib.MergeTreeDeltaType.GROUP,
            };
            client.localTransaction(groupOp);
            break;
        }
        case OverlayNodePosition.Prepend: {
            let afterRef = <MergeLib.IMarkerPosition>{ id: refNodeId };
            let markerOps = createTreeMarkerOps(afterRef, afterRef,
                nodeId, nodeType, beginProps);
            let groupOp = <MergeLib.IMergeTreeGroupMsg>{
                ops: [markerOps[1], markerOps[0]],
                type: MergeLib.MergeTreeDeltaType.GROUP,
            };
            client.localTransaction(groupOp);
            break;
        }
        case OverlayNodePosition.Above: {
            let endId = endIdFromId(refNodeId);
            let afterRef = <MergeLib.IMarkerPosition>{ id: endId };
            let beforeRef = <MergeLib.IMarkerPosition>{ id: refNodeId, before: true };
            let markerOps = createTreeMarkerOps(beforeRef, afterRef, nodeId,
                nodeType, beginProps);
            let groupOp = <MergeLib.IMergeTreeGroupMsg>{
                ops: markerOps,
                type: MergeLib.MergeTreeDeltaType.GROUP,
            };
            client.localTransaction(groupOp);
            break;
        }
        case OverlayNodePosition.Left: {
            let beforeRef = <MergeLib.IMarkerPosition>{ id: refNodeId, before: true };
            let markerOps = createTreeMarkerOps(beforeRef, beforeRef,
                nodeId, nodeType, beginProps);
            let groupOp = <MergeLib.IMergeTreeGroupMsg>{
                ops: markerOps,
                type: MergeLib.MergeTreeDeltaType.GROUP,
            };
            client.localTransaction(groupOp);
            break;
        }
        case OverlayNodePosition.Right: {
            let endId = endIdFromId(refNodeId);
            let afterRef = <MergeLib.IMarkerPosition>{ id: endId };
            let markerOps = createTreeMarkerOps(afterRef, afterRef,
                nodeId, nodeType, beginProps);
            let groupOp = <MergeLib.IMergeTreeGroupMsg>{
                ops: [markerOps[1], markerOps[0]],
                type: MergeLib.MergeTreeDeltaType.GROUP,
            };
            client.localTransaction(groupOp);
            break;
        }
        case OverlayNodePosition.Root: {
            let markerOps = createTreeMarkerOps(undefined, undefined,
            nodeId, nodeType, beginProps);
            markerOps[0].pos1 = 0;
            markerOps[1].pos1 = 0;
            let groupOp = <MergeLib.IMergeTreeGroupMsg>{
                ops: [markerOps[1], markerOps[0]],
                type: MergeLib.MergeTreeDeltaType.GROUP,
            };
            client.localTransaction(groupOp);
            break;
        }
    }
    return nodeId;
}

