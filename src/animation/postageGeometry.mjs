export const stampPlacement = { left: .71, top: .19, width: .16, rotation: -2 };

export function stampEntersEnvelope(center, bounds) {
  return Boolean(bounds && center.x >= bounds.left && center.x <= bounds.right
    && center.y >= bounds.top && center.y <= bounds.bottom);
}

export function attachedStampBounds(envelope, aspectRatio) {
  const width = envelope.width * stampPlacement.width;
  const height = width / aspectRatio;
  return {
    x: envelope.left + envelope.width * stampPlacement.left + width / 2,
    y: envelope.top + envelope.height * stampPlacement.top + height / 2,
    width, height, rotation: stampPlacement.rotation,
  };
}
