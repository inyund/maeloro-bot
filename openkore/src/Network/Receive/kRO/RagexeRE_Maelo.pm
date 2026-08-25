# MaeloRO: kRO_RagexeRE_0 + 0AC4 account_server_info (server replies with it to 0064 login)
# 2026-08-25 "Secure wsProxy" update: version 45->55, AC4 grew to 224B:
#   pid len | AID(4) auth(4) li2(4) | sex@16 | x30 | webAuthToken Z17 @47 | server entries (160B) @64
package Network::Receive::kRO::RagexeRE_Maelo;
use strict;
use base qw(Network::Receive::kRO::RagexeRE_0);

sub new {
	my ($class) = @_;
	my $self = $class->SUPER::new(@_);
	my %packets = (
		'0AC4' => ['account_server_info', 'v a4 a4 a4 x30 C Z17 a*', [qw(len sessionID accountID sessionID2 accountSex webAuthToken serverInfo)]],
		'09A0' => ['sync_received_characters', 'V', [qw(sync_Count)]],
		'020D' => ['sync_received_characters', 'v', []], # MaeloRO uses 0x020D (len 4) as charlist notify
	);
	$self->{packet_list}{$_} = $packets{$_} for keys %packets;
	return $self;
}

1;
