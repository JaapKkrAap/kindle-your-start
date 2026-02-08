export const RelationshipDashboard = ({ characterId, personaId }: { characterId: string; personaId?: string }) => {
    return (
        <div style={{ padding: '20px', border: '5px solid red', margin: '10px', backgroundColor: 'yellow', color: 'black', fontWeight: 'bold' }}>
            DASHBOARD TEST: {characterId}
        </div>
    );
};
