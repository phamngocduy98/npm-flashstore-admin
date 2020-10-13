// *
// * Decorator functions for Flashstore Library
// * https://github.com/phamngocduy98/node_flashstore_library
// *

import "reflect-metadata";
import {DocumentData, DocumentDataConstructor, ICollectionParent} from "../internal";

const CollectionRegistrationMetadataKey = Symbol("CollectionRegistrationMetadataKey");

export interface ICollectionRegistrationMetadata {
    collectionInstancePropertyKey: string;
    collectionName: string;
    isRealtime: boolean;
    dataConstructor: DocumentDataConstructor<any>;
}

export function getRegisteredCollections(target: any): ICollectionRegistrationMetadata[] {
    return Reflect.getMetadata(CollectionRegistrationMetadataKey, target) || [];
}

// @RealtimeCollection
export function RealtimeCollection(dataConstructor: DocumentDataConstructor<any>, collectionName: string) {
    return function (target: ICollectionParent, propertyKey: string): any {
        let registeredCollections = getRegisteredCollections(target);
        let metaData: ICollectionRegistrationMetadata = {
            collectionInstancePropertyKey: propertyKey,
            collectionName: collectionName,
            isRealtime: true,
            dataConstructor: dataConstructor
        };
        registeredCollections.push(metaData);
        Reflect.defineMetadata(CollectionRegistrationMetadataKey, registeredCollections, target);
    };
}

// @Collection
export function Collection(dataConstructor: DocumentDataConstructor<any>, collectionName?: string) {
    return function (target: ICollectionParent | DocumentData, propertyKey: string): any {
        let registeredCollections = getRegisteredCollections(target);
        let metaData: ICollectionRegistrationMetadata = {
            collectionInstancePropertyKey: propertyKey,
            collectionName: collectionName ?? propertyKey,
            isRealtime: false,
            dataConstructor: dataConstructor
        };
        registeredCollections.push(metaData);
        Reflect.defineMetadata(CollectionRegistrationMetadataKey, registeredCollections, target);
    };
}

/*******************
 * LINKING FEATURE
 ******************/

const LinkingMetadataKey = Symbol("LinkingMetadataKey");

export interface ILinkingMetadata {
    propertyKey: string;
    collectionPathFromRoot: string;
    mode: "docRef[]" | "docRef";
}

export function getRegisteredLinkingItems(target: any): ILinkingMetadata[] {
    return Reflect.getMetadata(LinkingMetadataKey, target) || [];
}

// @FDArray
export function RefFDUnionArray(collectionPathFromRoot: string) {
    return function (target: DocumentData, propertyKey: string): any {
        let prevLinkedMetadata = getRegisteredLinkingItems(target);
        let metaData: ILinkingMetadata = {
            propertyKey: propertyKey,
            collectionPathFromRoot: collectionPathFromRoot,
            mode: "docRef[]"
        };
        prevLinkedMetadata.push(metaData);
        Reflect.defineMetadata(LinkingMetadataKey, prevLinkedMetadata, target);
    };
}

// @LinkFirestoreDocument
export function RefFDocument(collectionPathFromRoot: string) {
    return function (target: DocumentData, propertyKey: string): any {
        let prevLinkedMetadata = getRegisteredLinkingItems(target);
        let metaData: ILinkingMetadata = {
            propertyKey: propertyKey,
            collectionPathFromRoot: collectionPathFromRoot,
            mode: "docRef"
        };
        prevLinkedMetadata.push(metaData);
        Reflect.defineMetadata(LinkingMetadataKey, prevLinkedMetadata, target);
    };
}
