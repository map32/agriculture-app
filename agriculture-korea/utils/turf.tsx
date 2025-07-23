import * as turf from '@turf/turf';
import featuresData from '@/assets/coordinates.json';
import midtermFeaturesData from '@/assets/midterm_coordinates.json';
import { FeatureCollection, Point } from 'geojson';
const featureCollection: FeatureCollection<Point> = featuresData as FeatureCollection<Point>;
const midtermFeatureCollection: FeatureCollection<Point> = midtermFeaturesData as FeatureCollection<Point>;
function findClosestPoint(coordinate: [number, number]) {
    const point = turf.point(coordinate);
    return turf.nearestPoint(point, featureCollection);
}

function findMidtermClosestPoint(coordinate: [number, number]) {
    const point = turf.point(coordinate);
    return turf.nearestPoint(point, midtermFeatureCollection);
}

export { findClosestPoint, findMidtermClosestPoint }